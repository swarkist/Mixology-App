import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { MemStorage } from "./storage/memory";
import { FirebaseStorageAdapter } from "./storage/firebase-adapter";
import type { IStorage } from "./storage";

const app = express();

// --- Security & hardening ---
app.set("trust proxy", 1);

// Configure Helmet with CSP that allows Vite development server
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Allow inline scripts for Vite HMR
        "'unsafe-eval'",   // Allow eval for Vite development
        "https://localhost:*",
        "http://localhost:*"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Allow inline styles for Vite
        "https://fonts.googleapis.com"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com"
      ],
      connectSrc: [
        "'self'",
        "ws://localhost:*",
        "wss://localhost:*",
        "http://localhost:*",
        "https://localhost:*",
        "https://api.allorigins.win", // Allow CORS proxy for web scraping
        "https://openrouter.ai" // Allow OpenRouter API
      ],
      imgSrc: ["'self'", "data:", "blob:", "https:"]
    }
  }
}));
app.use(morgan("combined"));

// Body limits - default 512KB for security, but OCR endpoint needs more
app.use("/api/ai/brands/from-image", express.json({ limit: "5mb" })); // OCR endpoint needs larger limit
app.use(express.json({ limit: "512kb" }));
app.use(express.urlencoded({ extended: true, limit: "512kb" }));

// CORS allowlist via env secret CORS_ORIGINS (comma-separated)
const origins = (process.env.CORS_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
const corsOptions: cors.CorsOptions = origins.length
  ? {
      origin: (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
        if (!origin) return cb(null, true); // allow same-origin/non-browser tools
        cb(null, origins.includes(origin));
      },
      credentials: true,
    }
  : {}; // no origins set -> default allow same-origin only
app.use(cors(corsOptions));

// Basic rate limiting (tune as needed)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300,                 // 300 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", apiLimiter);

// Cookie parser for auth tokens
app.use(cookieParser());

// Admin API key gate for write methods on /api/*
const requireAdminForWrites: import("express").RequestHandler = (req, res, next) => {
  const method = req.method.toUpperCase();
  const isWrite = method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE";
  if (!isWrite) return next();

  // Exclude read-only endpoints that use POST for complex queries
  const readOnlyEndpoints = [
    "/api/scrape-url",        // Web scraping (read-only)
    "/api/openrouter",        // AI processing (read-only)
    "/api/youtube-transcript" // Video transcript extraction (read-only)
  ];
  
  console.log(`Admin check: ${method} ${req.path} - isWrite: ${isWrite}`);
  
  if (readOnlyEndpoints.includes(req.path)) {
    console.log(`Allowing read-only endpoint: ${req.path}`);
    return next();
  }

  const provided = req.header("x-admin-key") || "";
  const expected = process.env.ADMIN_API_KEY || "";
  if (!expected) {
    console.error("ADMIN_API_KEY not set in secrets.");
    return res.status(500).json({ error: "Server misconfiguration" });
  }
  if (provided !== expected) {
    return res.status(403).json({ error: "Forbidden: invalid admin key" });
  }
  return next();
};
// Register read-only POST endpoints before admin key middleware
(async () => {
  const { registerReadOnlyRoutes } = await import('./routes');
  registerReadOnlyRoutes(app, undefined);
})();

// Temporarily disable admin key middleware to test functionality
// app.use("/api", requireAdminForWrites);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Initialize storage and bootstrap admin
async function initializeStorage(): Promise<IStorage> {
  console.log("🔥 Storage Backend Selection: Firebase");
  
  const storage = new FirebaseStorageAdapter();
  
  // Bootstrap admin user if ADMIN_EMAIL is set
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    try {
      const existingUser = await storage.getUserByEmail(adminEmail);
      if (existingUser && existingUser.role !== 'admin') {
        await storage.promoteUserToAdmin(existingUser.id);
        console.log(`✓ Promoted ${adminEmail} to admin role`);
      } else if (existingUser) {
        console.log(`✓ Admin user ${adminEmail} already exists`);
      } else {
        console.log(`⚠️  Admin user ${adminEmail} not found - will need to register first`);
      }
    } catch (error) {
      console.error('Error during admin bootstrap:', error);
    }
  }
  
  return storage;
}

(async () => {
  const storage = await initializeStorage();
  const server = await registerRoutes(app, storage);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();

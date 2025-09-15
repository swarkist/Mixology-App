import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

// General rate limiter for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting in development
    return process.env.NODE_ENV === 'development';
  }
});

// Stricter rate limiter for password reset requests
export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 password reset requests per windowMs
  message: {
    error: 'Too many password reset attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting in development
    return process.env.NODE_ENV === 'development';
  }
});

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per windowMs
  message: {
    error: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting in development
    return process.env.NODE_ENV === 'development';
  }
});

// Scraping-specific rate limiter
export const scrapingLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute 
  max: 10, // Limit each IP to 10 scraping requests per minute
  message: {
    ok: false,
    code: 'rate_limit_exceeded',
    message: 'Too many scraping requests, please try again later.',
    hint: 'Wait a minute before trying again or use the "Paste raw text" fallback.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting in development
    return process.env.NODE_ENV === 'development';
  }
});

// Account deletion rate limiter (very strict)
export const accountDeletionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 1, // Limit each user to 1 account deletion per 5 minutes
  message: {
    error: 'Account deletion rate limit exceeded. Please wait before trying again.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use user ID as key if available, otherwise fall back to IP
  keyGenerator: (req) => {
    return req.user?.id ? `user:${req.user.id}` : `ip:${ipKeyGenerator(req)}`;
  },
  skip: (req) => {
    // Skip rate limiting in development
    return process.env.NODE_ENV === 'development';
  }
});

// Secondary IP-based limiter for account deletion (prevents abuse)
export const accountDeletionIPLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 account deletions per hour
  message: {
    error: 'Too many account deletions from this location. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting in development
    return process.env.NODE_ENV === 'development';
  }
});
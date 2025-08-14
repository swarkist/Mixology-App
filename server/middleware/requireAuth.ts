import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/auth';
import { IStorage } from '../storage';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        role: 'basic' | 'reviewer' | 'admin';
        is_active: boolean;
      };
      csrfToken?: string;
    }
  }
}

// Middleware to require authentication
export function requireAuth(storage: IStorage) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accessToken = req.cookies.accessToken;

      if (!accessToken) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const decoded = verifyAccessToken(accessToken);
      if (!decoded || !decoded.id) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      // Check if user still exists and is active
      const user = await storage.getUserById(decoded.id);
      if (!user || !user.is_active) {
        return res.status(401).json({ error: 'User not found or inactive' });
      }

      // Attach user to request
      req.user = {
        id: user.id,
        role: user.role,
        is_active: user.is_active
      };

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(401).json({ error: 'Authentication failed' });
    }
  };
}

// Middleware to require specific role
export function requireRole(role: 'admin' | 'basic' | 'reviewer') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

// Middleware to require admin role
export const requireAdmin = requireRole('admin');
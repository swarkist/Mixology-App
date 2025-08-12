import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/auth';
import type { IStorage } from '../storage';

// Create the auth middleware factory
export function createAuthMiddleware(storage: IStorage) {
  
  // Middleware to check if user is authenticated
  const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accessToken = req.cookies.accessToken;

      if (!accessToken) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const decoded = verifyAccessToken(accessToken);
      if (!decoded || !decoded.id) {
        return res.status(401).json({ message: 'Invalid or expired token' });
      }

      // Check if user still exists and is active
      const user = await storage.getUserById(decoded.id);
      if (!user || !user.is_active) {
        return res.status(401).json({ message: 'User not found or inactive' });
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
      return res.status(401).json({ message: 'Authentication failed' });
    }
  };
  
  // Middleware to check if user is admin
  const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accessToken = req.cookies.accessToken;

      if (!accessToken) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const decoded = verifyAccessToken(accessToken);
      if (!decoded || !decoded.id) {
        return res.status(401).json({ message: 'Invalid or expired token' });
      }

      // Check if user still exists and is active
      const user = await storage.getUserById(decoded.id);
      if (!user || !user.is_active) {
        return res.status(401).json({ message: 'User not found or inactive' });
      }
      
      // Check if user is admin
      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      // Attach user to request
      req.user = {
        id: user.id,
        role: user.role,
        is_active: user.is_active
      };

      next();
    } catch (error) {
      console.error('Admin middleware error:', error);
      return res.status(401).json({ message: 'Authorization error' });
    }
  };
  
  return {
    requireAuth,
    requireAdmin
  };
}
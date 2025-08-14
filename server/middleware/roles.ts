import type { Request, Response, NextFunction } from "express";

// Middleware to allow multiple roles access to a route
export function allowRoles(...roles: ('basic' | 'reviewer' | 'admin')[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'The information you provided doesn\'t match our records.' });
    }

    next();
  };
}

// Middleware to reject write operations for reviewers
export function rejectWritesForReviewer(req: Request, res: Response, next: NextFunction) {
  // Only apply to authenticated requests
  if (!req.user) {
    return next();
  }

  // Block write operations for reviewers
  if (req.user.role === 'reviewer' && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return res.status(403).json({ error: 'The information you provided doesn\'t match our records.' });
  }

  next();
}
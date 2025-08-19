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

// Middleware to reject specific save operations for reviewers
// Note: Reviewers can access edit forms and AI importer, but cannot save content changes
export function rejectContentSavesForReviewer(req: Request, res: Response, next: NextFunction) {
  // Only apply to authenticated requests
  if (!req.user) {
    return next();
  }

  // Check if this is a content save operation that reviewers should not perform
  const isContentSave = req.user.role === 'reviewer' && 
    ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) &&
    (req.path.includes('/cocktails') || req.path.includes('/ingredients')) &&
    !req.path.includes('/toggle-mybar'); // Allow My Bar operations

  if (isContentSave) {
    return res.status(403).json({ error: 'The information you provided doesn\'t match our records.' });
  }

  next();
}
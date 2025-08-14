import { Router } from 'express';
export const debugRouter = Router();

debugRouter.get('/_whoami', (req: any, res) => {
  res.json({
    user: req.user ? { id: req.user.id ?? req.user._id ?? req.user.uid } : null,
    hasSession: !!req.session,
  });
});

debugRouter.use((req, _res, next) => {
  if (req.path.startsWith('/cocktails')) {
    console.log('[DBG] favoriteOnly?', req.query.favoriteOnly, 'Origin:', req.headers.origin, 'Cookie present:', !!req.headers.cookie);
  }
  next();
});
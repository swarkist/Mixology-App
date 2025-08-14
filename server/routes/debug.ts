import { Router } from 'express';
export const debugRouter = Router();

debugRouter.get('/_whoami', (req: any, res) => {
  const sessionUser = req.session?.user || req.session?.userId ? {
    id: req.session.userId || req.session.user?.id,
    email: req.session.user?.email,
    role: req.session.user?.role
  } : null;
  
  const jwtUser = req.user ? { 
    id: req.user.id ?? req.user._id ?? req.user.uid,
    email: req.user.email,
    role: req.user.role
  } : null;
  
  res.json({
    user: sessionUser || jwtUser,
    hasSession: !!req.session,
    sessionId: req.session?.id,
    sessionUserId: req.session?.userId,
    cookies: req.headers.cookie ? 'present' : 'absent'
  });
});

debugRouter.use((req, _res, next) => {
  if (req.path.startsWith('/cocktails')) {
    console.log('[DBG] favoriteOnly?', req.query.favoriteOnly, 'Origin:', req.headers.origin, 'Cookie present:', !!req.headers.cookie);
  }
  next();
});
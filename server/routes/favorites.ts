import { Router } from 'express';
import { getUserFavoriteIds, toggleFavorite } from '../storage/favorites';

export const favoritesRouter = Router();

// Define a simple auth middleware
function requireAuth(req: any, res: any, next: any) {
  console.log('🔥 Favorites auth check:', { user: req.user, sessionExists: !!req.session });
  if (req.user) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

favoritesRouter.get('/user/favorites', requireAuth, async (req: any, res) => {
  const userId = String(req.user?.id ?? req.user?._id ?? req.user?.uid ?? '');
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const ids = await getUserFavoriteIds(userId);
  res.json({ ids });
});

favoritesRouter.post('/user/favorites/:cocktailId', requireAuth, async (req: any, res) => {
  const userId = String(req.user?.id ?? req.user?._id ?? req.user?.uid ?? '');
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const { cocktailId } = req.params;
  const favorited = await toggleFavorite(userId, String(cocktailId));
  res.json({ favorited });
});

export default favoritesRouter;
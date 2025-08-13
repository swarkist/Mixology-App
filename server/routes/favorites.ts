import { Router, Request, Response } from 'express';
import { getUserFavoriteIds, toggleFavorite } from '../storage/favorites';
import { requireAuth } from '../middleware/requireAuth';

const favoritesRouter = Router();

favoritesRouter.get('/user/favorites', requireAuth, async (req: any, res: Response) => {
  try {
    const userId = req.user?.id?.toString();
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    
    const ids = await getUserFavoriteIds(userId);
    res.json({ ids });
  } catch (error) {
    console.error('Error fetching user favorites:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

favoritesRouter.post('/user/favorites/:cocktailId', requireAuth, async (req: any, res: Response) => {
  try {
    const userId = req.user?.id?.toString();
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    
    const { cocktailId } = req.params;
    const favorited = await toggleFavorite(userId, cocktailId);
    res.json({ favorited });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default favoritesRouter;
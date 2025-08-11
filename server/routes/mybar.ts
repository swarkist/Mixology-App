import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/requireAuth';
import type { IStorage } from '../storage';

const addToMyBarSchema = z.object({
  type: z.enum(['ingredient', 'brand']),
  ref_id: z.number().int().positive()
});

export function createMyBarRoutes(storage: IStorage): Router {
  const router = Router();

  // All routes require authentication
  router.use(requireAuth(storage));

  // GET /api/mybar - Get current user's bar items
  router.get('/', async (req, res) => {
    try {
      const items = await storage.getMyBarItems(req.user!.id);
      
      // Group items by type and fetch related data
      const ingredients = [];
      const brands = [];
      
      for (const item of items) {
        if (item.type === 'ingredient') {
          const ingredient = await storage.getIngredient(item.ref_id);
          if (ingredient) {
            ingredients.push({
              ...ingredient,
              myBarId: item.id
            });
          }
        } else if (item.type === 'brand') {
          const brand = await storage.getPreferredBrand(item.ref_id);
          if (brand) {
            brands.push({
              ...brand,
              myBarId: item.id
            });
          }
        }
      }
      
      res.json({
        ingredients,
        brands,
        total: ingredients.length + brands.length
      });
      
    } catch (error) {
      console.error('Get my bar error:', error);
      res.status(500).json({ error: 'Failed to get my bar items' });
    }
  });

  // POST /api/mybar - Add item to user's bar
  router.post('/', async (req, res) => {
    try {
      const { type, ref_id } = addToMyBarSchema.parse(req.body);
      
      // Verify the referenced item exists
      if (type === 'ingredient') {
        const ingredient = await storage.getIngredient(ref_id);
        if (!ingredient) {
          return res.status(404).json({ error: 'Ingredient not found' });
        }
      } else if (type === 'brand') {
        const brand = await storage.getPreferredBrand(ref_id);
        if (!brand) {
          return res.status(404).json({ error: 'Brand not found' });
        }
      }

      // Add to my bar (will handle duplicates via unique constraint)
      try {
        const item = await storage.addToMyBar({
          user_id: req.user!.id,
          type,
          ref_id
        });

        // Log the action
        await storage.createAuditLog({
          user_id: req.user!.id,
          action: 'add_to_mybar',
          resource: type,
          resource_id: ref_id.toString(),
          metadata: null,
          ip: req.ip,
          user_agent: req.get('User-Agent')
        });

        res.status(201).json({
          success: true,
          item
        });
        
      } catch (error: any) {
        // Handle duplicate constraint violation
        if (error.message?.includes('UNIQUE constraint') || 
            error.code === 'P2002' || 
            error.code === '23505') {
          return res.status(409).json({ 
            error: 'Item already in your bar' 
          });
        }
        throw error;
      }
      
    } catch (error) {
      console.error('Add to my bar error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Invalid request data',
          details: error.errors 
        });
      }
      res.status(500).json({ error: 'Failed to add item to bar' });
    }
  });

  // DELETE /api/mybar/:itemId - Remove item from user's bar
  router.delete('/:itemId', async (req, res) => {
    try {
      const itemId = parseInt(req.params.itemId);
      if (isNaN(itemId)) {
        return res.status(400).json({ error: 'Invalid item ID' });
      }

      // Get the item to verify ownership and for logging
      const items = await storage.getMyBarItems(req.user!.id);
      const item = items.find(i => i.id === itemId);
      
      if (!item) {
        return res.status(404).json({ error: 'Item not found in your bar' });
      }

      // Remove the item
      await storage.removeFromMyBar(req.user!.id, item.type, item.ref_id);

      // Log the action
      await storage.createAuditLog({
        user_id: req.user!.id,
        action: 'remove_from_mybar',
        resource: item.type,
        resource_id: item.ref_id.toString(),
        metadata: null,
        ip: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'Item removed from your bar'
      });
      
    } catch (error) {
      console.error('Remove from my bar error:', error);
      res.status(500).json({ error: 'Failed to remove item from bar' });
    }
  });

  return router;
}
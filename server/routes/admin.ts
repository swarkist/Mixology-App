import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireAdmin } from '../middleware/requireAuth';
import type { IStorage } from '../storage';

const updateUserRoleSchema = z.object({
  role: z.enum(['basic', 'reviewer', 'admin'])
});

const updateUserStatusSchema = z.object({
  is_active: z.boolean()
});

export function createAdminRoutes(storage: IStorage): Router {
  const router = Router();

  // All routes require admin authentication
  router.use(requireAuth(storage));
  router.use(requireAdmin);

  // GET /api/admin/users - List and search users
  router.get('/users', async (req, res) => {
    try {
      const {
        query: searchQuery,
        role,
        status,
        page = '1',
        limit = '20'
      } = req.query;

      const options = {
        search: searchQuery as string,
        role: role as 'basic' | 'admin',
        status: status === 'true' ? true : status === 'false' ? false : undefined,
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 20
      };

      // Ensure limit doesn't exceed 100
      options.limit = Math.min(options.limit, 100);

      const result = await storage.getAllUsers(options);
      
      // Remove sensitive data
      const sanitizedUsers = result.users.map(user => ({
        id: user.id,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
        email_verified_at: user.email_verified_at,
        created_at: user.created_at,
        updated_at: user.updated_at
      }));

      res.json({
        users: sanitizedUsers,
        total: result.total,
        page: options.page,
        limit: options.limit,
        totalPages: Math.ceil(result.total / options.limit)
      });
      
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Failed to get users' });
    }
  });

  // PATCH /api/admin/users/:id/role - Update user role
  router.patch('/users/:id/role', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      const { role } = updateUserRoleSchema.parse(req.body);
      
      // Get current user info
      const targetUser = await storage.getUserById(userId);
      if (!targetUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Last admin protection
      if (targetUser.role === 'admin' && role === 'basic') {
        const lastAdmin = await storage.getLastActiveAdmin();
        if (lastAdmin && lastAdmin.id === userId) {
          // Check if there are other active admins
          const { users: adminUsers } = await storage.getAllUsers({ 
            role: 'admin', 
            status: true 
          });
          const activeAdmins = adminUsers.filter(u => u.is_active);
          
          if (activeAdmins.length <= 1) {
            return res.status(403).json({ 
              error: 'Cannot demote the last active admin' 
            });
          }
        }
      }

      // Update role
      const updatedUser = await storage.updateUserRole(userId, role as 'basic' | 'admin');

      // Log the action
      await storage.createAuditLog({
        user_id: req.user!.id,
        action: 'change_role',
        resource: 'user',
        resource_id: userId.toString(),
        metadata: { 
          old_role: targetUser.role, 
          new_role: role,
          target_user_email: targetUser.email
        },
        ip: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.json({
        success: true,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role,
          is_active: updatedUser.is_active
        }
      });
      
    } catch (error) {
      console.error('Update user role error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Invalid request data',
          details: error.errors 
        });
      }
      res.status(500).json({ error: 'Failed to update user role' });
    }
  });

  // PATCH /api/admin/users/:id/status - Update user active status
  router.patch('/users/:id/status', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      const { is_active } = updateUserStatusSchema.parse(req.body);
      
      // Get current user info
      const targetUser = await storage.getUserById(userId);
      if (!targetUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Last admin protection - can't deactivate last active admin
      if (targetUser.role === 'admin' && is_active === false && targetUser.is_active === true) {
        const { users: adminUsers } = await storage.getAllUsers({ 
          role: 'admin', 
          status: true 
        });
        const activeAdmins = adminUsers.filter(u => u.is_active);
        
        if (activeAdmins.length <= 1) {
          return res.status(403).json({ 
            error: 'Cannot deactivate the last active admin' 
          });
        }
      }

      // Update status
      const updatedUser = await storage.updateUserStatus(userId, is_active);

      // Revoke all sessions if deactivating
      if (!is_active) {
        await storage.revokeAllUserSessions(userId);
      }

      // Log the action
      await storage.createAuditLog({
        user_id: req.user!.id,
        action: 'change_status',
        resource: 'user',
        resource_id: userId.toString(),
        metadata: { 
          old_status: targetUser.is_active, 
          new_status: is_active,
          target_user_email: targetUser.email
        },
        ip: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.json({
        success: true,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role,
          is_active: updatedUser.is_active
        }
      });
      
    } catch (error) {
      console.error('Update user status error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Invalid request data',
          details: error.errors 
        });
      }
      res.status(500).json({ error: 'Failed to update user status' });
    }
  });

  // GET /api/admin/users/:id/mybar - View user's bar (read-only)
  router.get('/users/:id/mybar', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      // Verify user exists
      const targetUser = await storage.getUserById(userId);
      if (!targetUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      const items = await storage.getUserMyBarByAdmin(userId);
      
      // Group items by type and fetch related data
      const ingredients = [];
      const brands = [];
      
      for (const item of items) {
        if (item.type === 'ingredient') {
          const ingredient = await storage.getIngredient(item.ref_id);
          if (ingredient) {
            ingredients.push({
              ...ingredient,
              myBarId: item.id,
              addedAt: item.created_at
            });
          }
        } else if (item.type === 'brand') {
          const brand = await storage.getPreferredBrand(item.ref_id);
          if (brand) {
            brands.push({
              ...brand,
              myBarId: item.id,
              addedAt: item.created_at
            });
          }
        }
      }

      // Log the viewing action
      await storage.createAuditLog({
        user_id: req.user!.id,
        action: 'view_user_bar',
        resource: 'user',
        resource_id: userId.toString(),
        metadata: { 
          target_user_email: targetUser.email,
          items_count: ingredients.length + brands.length
        },
        ip: req.ip,
        user_agent: req.get('User-Agent')
      });
      
      res.json({
        user: {
          id: targetUser.id,
          email: targetUser.email
        },
        ingredients,
        brands,
        total: ingredients.length + brands.length
      });
      
    } catch (error) {
      console.error('Get user bar error:', error);
      res.status(500).json({ error: 'Failed to get user bar' });
    }
  });

  return router;
}
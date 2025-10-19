import { Router } from 'express';
import { z } from 'zod';
import { hashPassword, verifyPassword, signAccessToken, signRefreshToken, setAuthCookies, clearAuthCookies, normalizeEmail, generateCSRFToken } from '../lib/auth';
import { createResetToken, hashToken, generateResetURL } from '../lib/passwordReset';
import { sendPasswordResetEmail } from '../lib/mailer';
import { requireAuth } from '../middleware/requireAuth';
import { authLimiter, passwordResetLimiter, accountDeletionLimiter, accountDeletionIPLimiter } from '../middleware/rateLimiter';
import type { IStorage } from '../storage';
import { logger } from '../lib/logger';

// Generic error message for security (no account enumeration)
const GENERIC_ERROR_MESSAGE = "The information you provided doesn't match our records.";

// Validation schemas
const registerSchema = z.object({
  email: z.string().email().transform(normalizeEmail),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

const loginSchema = z.object({
  email: z.string().email().transform(normalizeEmail),
  password: z.string().min(1, 'Password is required')
});

const forgotPasswordSchema = z.object({
  email: z.string().email().transform(normalizeEmail)
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  new_password: z.string().min(8, 'Password must be at least 8 characters')
});

export function createAuthRoutes(storage: IStorage): Router {
  const router = Router();

  // POST /api/auth/register
  router.post('/register', authLimiter, async (req, res) => {
    try {
      const { email, password } = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        // Return generic message (no account enumeration)
        return res.status(200).json({ 
          success: false, 
          message: GENERIC_ERROR_MESSAGE 
        });
      }

      // Hash password and create user
      const passwordHash = await hashPassword(password);
      const user = await storage.createUser({
        email,
        password_hash: passwordHash,
        role: 'basic',
        is_active: true
      });

      // Create session with placeholder token hash
      const session = await storage.createSession({
        user_id: user.id,
        refresh_token_hash: '', // Placeholder
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        ip: req.ip,
        user_agent: req.get('User-Agent') || null
      });

      // Generate tokens using the actual session ID
      const accessToken = signAccessToken(user);
      const refreshToken = signRefreshToken(session.id);

      // Update session with correct refresh token hash
      await storage.updateSessionToken(session.id, hashToken(refreshToken));

      // Set cookies
      setAuthCookies(res, accessToken, refreshToken);

      // Log registration
      await storage.createAuditLog({
        user_id: user.id,
        action: 'user_registered',
        resource: 'user',
        resource_id: user.id.toString(),
        metadata: null,
        ip: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.status(201).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          is_active: user.is_active
        }
      });

    } catch (error) {
      logger.error('Registration error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false, 
          message: error.errors[0].message 
        });
      }
      res.status(500).json({ 
        success: false, 
        message: 'Registration failed' 
      });
    }
  });

  // POST /api/auth/login
  router.post('/login', authLimiter, async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user || !user.is_active) {
        return res.status(200).json({ 
          success: false, 
          message: GENERIC_ERROR_MESSAGE 
        });
      }

      // Verify password
      const isValid = await verifyPassword(password, user.password_hash);
      if (!isValid) {
        return res.status(200).json({ 
          success: false, 
          message: GENERIC_ERROR_MESSAGE 
        });
      }

      // Create session with placeholder token hash
      const session = await storage.createSession({
        user_id: user.id,
        refresh_token_hash: '', // Placeholder
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ip: req.ip,
        user_agent: req.get('User-Agent') || null
      });

      // Generate tokens using the actual session ID
      const accessToken = signAccessToken(user);
      const refreshToken = signRefreshToken(session.id);

      // Update session with correct refresh token hash
      await storage.updateSessionToken(session.id, hashToken(refreshToken));

      // Set cookies
      setAuthCookies(res, accessToken, refreshToken);

      // Log login
      await storage.createAuditLog({
        user_id: user.id,
        action: 'user_login',
        resource: 'user',
        resource_id: user.id.toString(),
        metadata: null,
        ip: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          is_active: user.is_active
        }
      });

    } catch (error) {
      logger.error('Login error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false, 
          message: error.errors[0].message 
        });
      }
      res.status(500).json({ 
        success: false, 
        message: 'Login failed' 
      });
    }
  });

  // POST /api/auth/logout
  router.post('/logout', async (req, res) => {
    try {
      const refreshToken = req.cookies.refreshToken;
      
      if (refreshToken) {
        const tokenHash = hashToken(refreshToken);
        const session = await storage.getSessionByRefreshTokenHash(tokenHash);
        
        if (session) {
          await storage.revokeSession(session.id);
          
          // Log logout if we can identify the user
          if (req.user) {
            await storage.createAuditLog({
              user_id: req.user.id,
              action: 'user_logout',
              resource: 'user',
              resource_id: req.user.id.toString(),
              metadata: null,
              ip: req.ip,
              user_agent: req.get('User-Agent')
            });
          }
        }
      }

      clearAuthCookies(res);
      res.json({ success: true, message: 'Logged out successfully' });

    } catch (error) {
      console.error('Logout error:', error);
      clearAuthCookies(res);
      res.json({ success: true, message: 'Logged out successfully' });
    }
  });

  // GET /api/auth/me
  router.get('/me', requireAuth(storage), async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Get fresh user data from storage
      const fullUser = await storage.getUserById(user.id);
      if (!fullUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      const csrfToken = generateCSRFToken();
      
      res.json({
        user: {
          id: fullUser.id,
          email: fullUser.email,
          role: fullUser.role,
          is_active: fullUser.is_active
        },
        csrfToken
      });
      
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Failed to get profile' });
    }
  });

  // POST /api/auth/forgot
  router.post('/forgot', passwordResetLimiter, async (req, res) => {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);
      
      // Always return success message (no account enumeration)
      const successMessage = "If an account with that email exists, you will receive a password reset link shortly.";
      
      const user = await storage.getUserByEmail(email);
      if (user && user.is_active) {
        // Create reset token
        const { token, expires_at } = createResetToken(user.id);
        
        await storage.createPasswordReset({
          user_id: user.id,
          token_hash: hashToken(token),
          expires_at
        });

        // Send reset email
        const baseURL = process.env.NODE_ENV === 'production' 
          ? 'https://miximixology.com'
          : `http://localhost:5000`;
        const resetURL = generateResetURL(baseURL, token);
        
        await sendPasswordResetEmail(email, resetURL);

        // Log password reset request
        await storage.createAuditLog({
          user_id: user.id,
          action: 'password_reset_request',
          resource: 'user',
          resource_id: user.id.toString(),
          metadata: null,
          ip: req.ip,
          user_agent: req.get('User-Agent')
        });
      }

      res.status(200).json({ 
        success: true, 
        message: successMessage 
      });

    } catch (error) {
      console.error('Forgot password error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false, 
          message: error.errors[0].message 
        });
      }
      // Still return success to prevent enumeration
      res.status(200).json({ 
        success: true, 
        message: "If an account with that email exists, you will receive a password reset link shortly." 
      });
    }
  });

  // POST /api/auth/reset
  router.post('/reset', authLimiter, async (req, res) => {
    try {
      const { token, new_password } = resetPasswordSchema.parse(req.body);
      
      const tokenHash = hashToken(token);
      const resetRecord = await storage.getPasswordResetByTokenHash(tokenHash);
      
      if (!resetRecord || resetRecord.used_at || new Date() > new Date(resetRecord.expires_at)) {
        return res.status(200).json({ 
          success: false, 
          message: GENERIC_ERROR_MESSAGE 
        });
      }

      // Get user
      const user = await storage.getUserById(resetRecord.user_id);
      if (!user || !user.is_active) {
        return res.status(200).json({ 
          success: false, 
          message: GENERIC_ERROR_MESSAGE 
        });
      }

      // Update password
      const newPasswordHash = await hashPassword(new_password);
      await storage.updateUser(user.id, { password_hash: newPasswordHash });

      // Mark token as used
      await storage.markPasswordResetAsUsed(resetRecord.id);

      // Revoke all existing sessions
      await storage.revokeAllUserSessions(user.id);

      // Optionally auto-login user with new session
      const accessToken = signAccessToken(user);
      const refreshToken = signRefreshToken(0);

      const session = await storage.createSession({
        user_id: user.id,
        refresh_token_hash: hashToken(refreshToken),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ip: req.ip,
        user_agent: req.get('User-Agent') || null
      });

      const finalRefreshToken = signRefreshToken(session.id);
      await storage.revokeSession(session.id);
      await storage.createSession({
        user_id: user.id,
        refresh_token_hash: hashToken(finalRefreshToken),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ip: req.ip,
        user_agent: req.get('User-Agent') || null
      });

      setAuthCookies(res, accessToken, finalRefreshToken);

      // Log password reset
      await storage.createAuditLog({
        user_id: user.id,
        action: 'password_reset',
        resource: 'user',
        resource_id: user.id.toString(),
        metadata: null,
        ip: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.json({ 
        success: true, 
        message: 'Password reset successfully',
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          is_active: user.is_active
        }
      });

    } catch (error) {
      console.error('Reset password error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false, 
          message: error.errors[0].message 
        });
      }
      res.status(200).json({ 
        success: false, 
        message: GENERIC_ERROR_MESSAGE 
      });
    }
  });

  // DELETE /api/auth/account
  router.delete('/account', requireAuth(storage), accountDeletionLimiter, accountDeletionIPLimiter, async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check if this is the last active admin
      if (user.role === 'admin') {
        const admins = await storage.getAllUsers({ role: 'admin', status: true });
        const activeAdmins = admins.users.filter(admin => admin.is_active);
        
        if (activeAdmins.length <= 1) {
          return res.status(403).json({ 
            error: 'Cannot delete the last active admin account'
          });
        }
      }

      // Check if user already deleted (idempotency)
      const currentUser = await storage.getUserById(user.id);
      if (!currentUser) {
        return res.status(200).json({ 
          status: 'ok', 
          message: 'Account already removed' 
        });
      }

      // Revoke all user sessions
      await storage.revokeAllUserSessions(user.id);

      // Clear password reset tokens (cleanup expired ones handles user-specific)
      await storage.cleanExpiredPasswordResets();

      // Delete user (CASCADE DELETE handles my_bar, preferred_brands, sessions)
      await storage.deleteUser(user.id);

      // Clear current session cookies
      clearAuthCookies(res);

      // Log account deletion
      await storage.createAuditLog({
        user_id: user.id,
        action: 'account_deleted',
        resource: 'user',
        resource_id: user.id.toString(),
        metadata: { email: currentUser.email },
        ip: req.ip,
        user_agent: req.get('User-Agent')
      });

      res.json({ 
        status: 'ok', 
        message: 'Account deleted' 
      });

    } catch (error) {
      console.error('Account deletion error:', error);
      res.status(500).json({ 
        error: 'Failed to delete account' 
      });
    }
  });

  return router;
}
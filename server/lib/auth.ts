import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Response } from 'express';
import type { User } from '@shared/schema';

const JWT_SECRET = process.env.JWT_SECRET!;
const REFRESH_SECRET = process.env.REFRESH_SECRET!;

if (!JWT_SECRET || !REFRESH_SECRET) {
  throw new Error('JWT_SECRET and REFRESH_SECRET environment variables are required');
}

// Password hashing with bcrypt (cost factor 12 for strong security)
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// JWT token generation and verification
export function signAccessToken(user: Pick<User, 'id' | 'role' | 'is_active'>): string {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      is_active: user.is_active
    },
    JWT_SECRET,
    { expiresIn: '30m' } // Short-lived access token
  );
}

export function signRefreshToken(sessionId: number): string {
  return jwt.sign(
    { sessionId },
    REFRESH_SECRET,
    { expiresIn: '7d' } // Longer-lived refresh token
  );
}

export function verifyAccessToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function verifyRefreshToken(token: string): any {
  try {
    return jwt.verify(token, REFRESH_SECRET);
  } catch (error) {
    return null;
  }
}

// Cookie management for secure auth
export function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Access token cookie (shorter expiry)
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 30 * 60 * 1000, // 30 minutes
    path: '/'
  });

  // Refresh token cookie (longer expiry)
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/'
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie('accessToken', { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });
  res.clearCookie('refreshToken', { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });
}

// Email normalization
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// Generate CSRF token
export function generateCSRFToken(): string {
  return require('crypto').randomBytes(32).toString('hex');
}
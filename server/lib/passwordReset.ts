import crypto from 'crypto';
import { IStorage } from '../storage';

export interface ResetTokenResult {
  token: string;
  expires_at: Date;
}

// Create a secure password reset token
export function createResetToken(userId: number): ResetTokenResult {
  // Generate cryptographically secure random token (32 bytes = 256 bits)
  const token = crypto.randomBytes(32).toString('hex');
  
  // Token expires in 30 minutes
  const expires_at = new Date(Date.now() + 30 * 60 * 1000);
  
  return { token, expires_at };
}

// Hash token for secure storage
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Verify and consume a password reset token
export async function verifyAndConsumeResetToken(
  storage: IStorage, 
  token: string
): Promise<number | null> {
  const tokenHash = hashToken(token);
  
  try {
    // Find the reset record
    const resetRecord = await storage.getPasswordResetByTokenHash(tokenHash);
    
    if (!resetRecord) {
      return null; // Token not found
    }

    // Check if token is expired
    if (new Date() > new Date(resetRecord.expires_at)) {
      return null; // Token expired
    }

    // Check if token was already used
    if (resetRecord.used_at) {
      return null; // Token already used
    }

    // Mark token as used
    await storage.markPasswordResetAsUsed(resetRecord.id);
    
    return resetRecord.user_id;
  } catch (error) {
    console.error('Error verifying reset token:', error);
    return null;
  }
}

// Generate password reset URL
export function generateResetURL(baseURL: string, token: string): string {
  return `${baseURL}/reset?token=${token}`;
}
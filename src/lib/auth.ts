import crypto from 'crypto';

const AUTH_SECRET = process.env.AUTH_SECRET || 'pull-logic-ops-dashboard-secret-key-2026';
export const AUTH_COOKIE_NAME = 'pulllogic_session';

/**
 * Hash a plain text password with PBKDF2 using crypto
 */
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const passwordSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, passwordSalt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt: passwordSalt };
}

/**
 * Verify a plain text password against the stored hash and salt
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const testHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(testHash, 'hex'), Buffer.from(hash, 'hex'));
}

/**
 * Create a signed session token
 */
export function createSessionToken(userId: string, username: string): string {
  const payload = JSON.stringify({
    userId,
    username,
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  });
  const encodedPayload = Buffer.from(payload).toString('base64url');
  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(encodedPayload).digest('base64url');
  return `${encodedPayload}.${signature}`;
}

/**
 * Verify a signed session token
 */
export function verifySessionToken(token: string): { userId: string; username: string } | null {
  if (!token || !token.includes('.')) return null;
  try {
    const [encodedPayload, signature] = token.split('.');
    const expectedSignature = crypto.createHmac('sha256', AUTH_SECRET).update(encodedPayload).digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }

    return { userId: payload.userId, username: payload.username };
  } catch (err) {
    return null;
  }
}

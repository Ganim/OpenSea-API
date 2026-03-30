import { createHash } from 'node:crypto';

/**
 * Hashes a token using SHA-256.
 *
 * Used for storing access tokens securely — only the hash is persisted
 * in the database while the raw token is returned to the user once.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

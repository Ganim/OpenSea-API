import { createHmac, timingSafeEqual } from 'node:crypto';

import { env } from '@/@env/index.js';

/**
 * HMAC-signed unsubscribe token used in email footers.
 * The token format is `{userId}.{categoryId}.{signature}` where the
 * signature is HMAC-SHA256(JWT_SECRET, `${userId}:${categoryId}`).
 * Slashes/pluses are replaced with url-safe variants.
 */
function secret(): string {
  return env.JWT_SECRET + ':notifications-unsubscribe';
}

function sign(payload: string): string {
  return createHmac('sha256', secret())
    .update(payload)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function buildUnsubscribeToken(
  userId: string,
  categoryId: string,
): string {
  const payload = `${userId}:${categoryId}`;
  return `${userId}.${categoryId}.${sign(payload)}`;
}

export function verifyUnsubscribeToken(
  token: string,
): { userId: string; categoryId: string } | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [userId, categoryId, signature] = parts;
  const expected = sign(`${userId}:${categoryId}`);
  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return null;
    if (!timingSafeEqual(a, b)) return null;
    return { userId, categoryId };
  } catch {
    return null;
  }
}

export function buildUnsubscribeUrl(
  userId: string,
  categoryId: string,
): string {
  const base = env.PUBLIC_API_URL ?? 'http://localhost:3333';
  const token = buildUnsubscribeToken(userId, categoryId);
  return `${base}/v1/notifications/unsubscribe/${token}`;
}

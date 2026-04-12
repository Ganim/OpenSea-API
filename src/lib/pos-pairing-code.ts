import { createHmac } from 'node:crypto';

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 chars (5 bits each)
const CODE_LENGTH = 6;
const BUCKET_SECONDS = 60;

export function getCurrentBucket(now: Date = new Date()): number {
  return Math.floor(now.getTime() / 1000 / BUCKET_SECONDS);
}

export function getBucketExpiresAt(bucket: number): Date {
  return new Date((bucket + 1) * BUCKET_SECONDS * 1000);
}

export function generatePairingCode(secret: string, bucket: number): string {
  const hash = createHmac('sha256', secret).update(String(bucket)).digest();
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CHARSET[hash[i] & 0x1f];
  }
  return code;
}

/**
 * Returns { code, expiresAt } for the given secret.
 */
export function getCurrentPairingCode(
  secret: string,
  now: Date = new Date(),
): { code: string; expiresAt: Date } {
  const bucket = getCurrentBucket(now);
  return {
    code: generatePairingCode(secret, bucket),
    expiresAt: getBucketExpiresAt(bucket),
  };
}

/**
 * Checks if the given code matches the secret in the current or previous bucket.
 * (Tolerance: accepts current and previous bucket — effective up to ~120s window for the operator.)
 */
export function isValidPairingCode(
  secret: string,
  code: string,
  now: Date = new Date(),
): boolean {
  const currentBucket = getCurrentBucket(now);
  if (generatePairingCode(secret, currentBucket) === code) return true;
  if (generatePairingCode(secret, currentBucket - 1) === code) return true;
  return false;
}

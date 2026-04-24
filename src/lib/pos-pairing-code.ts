/**
 * @deprecated Use `@/lib/rotating-code` diretamente. Este módulo é um
 * thin wrapper preservado para os call sites existentes (punch-devices,
 * print-agents).
 */

import {
  generateRotatingCode,
  getBucketExpiresAt,
  getCurrentBucket,
  getCurrentRotatingCode,
  isValidRotatingCode,
} from './rotating-code';

export { getCurrentBucket, getBucketExpiresAt };

export function generatePairingCode(secret: string, bucket: number): string {
  return generateRotatingCode(secret, bucket);
}

export function getCurrentPairingCode(
  secret: string,
  now: Date = new Date(),
): { code: string; expiresAt: Date } {
  const { code, expiresAt } = getCurrentRotatingCode(secret, now);
  return { code, expiresAt };
}

export function isValidPairingCode(
  secret: string,
  code: string,
  now: Date = new Date(),
): boolean {
  return isValidRotatingCode(secret, code, now);
}

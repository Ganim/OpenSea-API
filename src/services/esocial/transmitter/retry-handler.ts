/**
 * Retry logic for eSocial batch transmission.
 * Uses exponential backoff: 5min, 15min, 45min, 2h, 6h.
 */

// Retry delays in seconds
const RETRY_DELAYS = [5 * 60, 15 * 60, 45 * 60, 2 * 3600, 6 * 3600];
const MAX_RETRIES = 5;

/**
 * Calculate the next retry date based on the current retry count.
 * Returns null if max retries exceeded.
 */
export function calculateNextRetry(retryCount: number): Date | null {
  if (retryCount >= MAX_RETRIES) return null;
  const delay =
    RETRY_DELAYS[retryCount] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
  return new Date(Date.now() + delay * 1000);
}

/**
 * Check if a retry is due (nextRetryAt is in the past).
 */
export function isRetryDue(nextRetryAt: Date | null): boolean {
  if (!nextRetryAt) return false;
  return new Date() >= new Date(nextRetryAt);
}

/**
 * Get a human-readable description of the retry schedule.
 */
export function getRetryDescription(retryCount: number): string {
  if (retryCount >= MAX_RETRIES) {
    return 'Número máximo de tentativas atingido';
  }

  const delay =
    RETRY_DELAYS[retryCount] || RETRY_DELAYS[RETRY_DELAYS.length - 1];

  if (delay < 3600) {
    return `Próxima tentativa em ${Math.round(delay / 60)} minutos`;
  }
  return `Próxima tentativa em ${Math.round(delay / 3600)} horas`;
}

export const ESOCIAL_RETRY_CONFIG = {
  MAX_RETRIES,
  RETRY_DELAYS,
} as const;

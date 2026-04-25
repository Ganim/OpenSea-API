import Redis from 'ioredis';
import { env } from '@/@env';
import { redisConfig } from '@/config/redis';

/**
 * Phase 9 / Plan 09-02 (D-17 / D-09) — BullMQ-shared client safety check.
 *
 * Investigated 2026-04-25: BullMQ in this project (Workers in src/workers/*)
 * does NOT call `getRedisClient()` for its own queue connections — it uses
 * a dedicated factory (`bullmq` lib creates its own Redis instance via the
 * `connection: redisConfig` option passed to Queue/Worker constructors).
 * Only `punch-daily-digest-scheduler.ts` and `punch-detect-missed-scheduler.ts`
 * use `getRedisClient()` for SET/EXPIRE locks (compatible with our usage).
 *
 * No BLPOP / brpop calls were found via grep on `src/workers/`, `src/lib/queue/`
 * or `src/lib/queues/`. SETNX/INCR/DEL/EXPIRE on this singleton are safe for
 * the new antifraude validators (rate-limit + face-match-streak).
 *
 * Decision: reuse `getRedisClient()` directly. No `getAntifraudeRedisClient()`
 * separate client needed.
 */

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(redisConfig);

    redisClient.on('connect', () => {
      if (env.NODE_ENV !== 'test') {
        console.log('[Redis] Connected successfully');
      }
    });

    redisClient.on('error', (err) => {
      console.error('[Redis] Connection error:', err.message);
    });

    redisClient.on('close', () => {
      if (env.NODE_ENV !== 'test') {
        console.log('[Redis] Connection closed');
      }
    });
  }

  return redisClient;
}

export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

export async function checkRedisHealth(): Promise<{
  status: 'up' | 'down';
  latency?: number;
  error?: string;
}> {
  try {
    const client = getRedisClient();
    const start = Date.now();
    await client.ping();
    const latency = Date.now() - start;

    return { status: 'up', latency };
  } catch (error) {
    return {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Exporta uma instância lazy para uso direto
export const redis = {
  get client() {
    return getRedisClient();
  },
};

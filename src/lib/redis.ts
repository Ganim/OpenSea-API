import Redis from 'ioredis';
import { env } from '@/@env';
import { redisConfig } from '@/config/redis';

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

import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { accessSharedFileController } from './v1-access-shared-file.controller';
import { downloadSharedFileController } from './v1-download-shared-file.controller';

export async function storagePublicRoutes(app: FastifyInstance) {
  const shareLinkKeyGenerator = (req: FastifyRequest) => {
    const params = req.params as { token?: string };
    // Rate limit by token + IP to prevent brute-force of passwords
    return params.token
      ? `share:${params.token}:${req.ip}`
      : req.ip;
  };

  // Query routes (access info) - rate limit by token
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, {
        ...rateLimitConfig.shareLink,
        keyGenerator: shareLinkKeyGenerator,
      });
      queryApp.register(accessSharedFileController);
    },
    { prefix: '' },
  );

  // Download routes (mutation-like: increments count) - rate limit by token
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, {
        ...rateLimitConfig.shareLink,
        keyGenerator: shareLinkKeyGenerator,
      });
      mutationApp.register(downloadSharedFileController);
    },
    { prefix: '' },
  );
}

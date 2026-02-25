import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import { accessSharedFileController } from './v1-access-shared-file.controller';
import { downloadSharedFileController } from './v1-download-shared-file.controller';

export async function storagePublicRoutes(app: FastifyInstance) {
  // Query routes (access info)
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(accessSharedFileController);
    },
    { prefix: '' },
  );

  // Download routes (mutation-like: increments count)
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(downloadSharedFileController);
    },
    { prefix: '' },
  );
}

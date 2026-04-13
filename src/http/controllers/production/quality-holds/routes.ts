import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { rateLimitConfig } from '@/config/rate-limits';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { listQualityHoldsController } from './v1-list-quality-holds.controller';
import { createQualityHoldController } from './v1-create-quality-hold.controller';
import { releaseQualityHoldController } from './v1-release-quality-hold.controller';

export async function qualityHoldsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('PRODUCTION'));

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(listQualityHoldsController);
    },
    { prefix: '' },
  );

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(createQualityHoldController);
      mutationApp.register(releaseQualityHoldController);
    },
    { prefix: '' },
  );
}

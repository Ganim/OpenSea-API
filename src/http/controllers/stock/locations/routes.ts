import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { rateLimitConfig } from '@/config/rate-limits';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { getLocationHealthSummaryController } from './v1-get-location-health-summary.controller';
import { searchItemLocationController } from './v1-search-item-location.controller';
import { setupLocationController } from './v1-setup-location.controller';

export async function locationsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('STOCK'));

  // Mutation routes with mutation rate limit
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      await setupLocationController(mutationApp);
    },
    { prefix: '' },
  );

  // Query routes with query rate limit
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      await getLocationHealthSummaryController(queryApp);
      await searchItemLocationController(queryApp);
    },
    { prefix: '' },
  );
}

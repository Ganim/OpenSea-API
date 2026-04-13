import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { rateLimitConfig } from '@/config/rate-limits';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { listProductionEntriesController } from './v1-list-production-entries.controller';
import { createProductionEntryController } from './v1-create-production-entry.controller';

export async function productionEntriesRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('PRODUCTION'));

  // Query routes com rate limit de consulta
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(listProductionEntriesController);
    },
    { prefix: '' },
  );

  // Mutation routes com rate limit de mutacao
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(createProductionEntryController);
    },
    { prefix: '' },
  );
}

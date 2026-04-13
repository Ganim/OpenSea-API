import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { rateLimitConfig } from '@/config/rate-limits';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { listTimeEntriesController } from './v1-list-time-entries.controller';
import { createTimeEntryController } from './v1-create-time-entry.controller';
import { endTimeEntryController } from './v1-end-time-entry.controller';

export async function timeEntriesRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('PRODUCTION'));

  // Query routes com rate limit de consulta
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(listTimeEntriesController);
    },
    { prefix: '' },
  );

  // Mutation routes com rate limit de mutacao
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(createTimeEntryController);
      mutationApp.register(endTimeEntryController);
    },
    { prefix: '' },
  );
}

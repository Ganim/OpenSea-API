import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { calculateWorkedHoursController } from './v1-calculate-worked-hours.controller';
import { clockInController } from './v1-clock-in.controller';
import { clockOutController } from './v1-clock-out.controller';
import { listTimeEntriesController } from './v1-list-time-entries.controller';

export async function timeControlRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('HR'));

  // Mutation routes - clock in/out
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(clockInController);
      mutationApp.register(clockOutController);
      mutationApp.register(calculateWorkedHoursController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(listTimeEntriesController);
    },
    { prefix: '' },
  );
}

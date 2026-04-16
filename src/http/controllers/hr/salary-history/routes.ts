import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { v1ListSalaryHistoryController } from './v1-list-salary-history.controller';
import { v1RegisterSalaryChangeController } from './v1-register-salary-change.controller';

export async function salaryHistoryRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('HR'));

  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1RegisterSalaryChangeController);
    },
    { prefix: '' },
  );

  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1ListSalaryHistoryController);
    },
    { prefix: '' },
  );
}

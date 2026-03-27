import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { v1AllocateFlexBenefitsController } from './v1-allocate-flex-benefits.controller';
import { v1GetMyAllocationController } from './v1-get-my-allocation.controller';
import { v1ListAllocationHistoryController } from './v1-list-allocation-history.controller';

export async function flexBenefitsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('HR'));

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1AllocateFlexBenefitsController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1GetMyAllocationController);
      queryApp.register(v1ListAllocationHistoryController);
    },
    { prefix: '' },
  );
}

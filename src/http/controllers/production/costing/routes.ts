import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { rateLimitConfig } from '@/config/rate-limits';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { createProductionCostController } from './v1-create-production-cost.controller';
import { listProductionCostsController } from './v1-list-production-costs.controller';
import { updateProductionCostController } from './v1-update-production-cost.controller';
import { calculateOrderCostController } from './v1-calculate-order-cost.controller';

export async function productionCostingRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('PRODUCTION'));

  // Query routes com rate limit de consulta
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(listProductionCostsController);
      queryApp.register(calculateOrderCostController);
    },
    { prefix: '' },
  );

  // Mutation routes com rate limit de mutacao
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(createProductionCostController);
      mutationApp.register(updateProductionCostController);
    },
    { prefix: '' },
  );
}

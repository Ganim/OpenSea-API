import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { rateLimitConfig } from '@/config/rate-limits';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { cancelProductionOrderController } from './v1-cancel-production-order.controller';
import { changeProductionOrderStatusController } from './v1-change-production-order-status.controller';
import { countProductionOrdersByStatusController } from './v1-count-production-orders-by-status.controller';
import { createProductionOrderController } from './v1-create-production-order.controller';
import { getProductionOrderByIdController } from './v1-get-production-order-by-id.controller';
import { listProductionOrdersController } from './v1-list-production-orders.controller';
import { updateProductionOrderController } from './v1-update-production-order.controller';

export async function productionOrdersRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('PRODUCTION'));

  // Query routes com rate limit de consulta
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(countProductionOrdersByStatusController);
      queryApp.register(listProductionOrdersController);
      queryApp.register(getProductionOrderByIdController);
    },
    { prefix: '' },
  );

  // Mutation routes com rate limit de mutação
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(createProductionOrderController);
      mutationApp.register(updateProductionOrderController);
      mutationApp.register(changeProductionOrderStatusController);
    },
    { prefix: '' },
  );

  // Admin routes com rate limit elevado
  app.register(
    async (adminApp) => {
      adminApp.register(rateLimit, rateLimitConfig.admin);
      adminApp.register(cancelProductionOrderController);
    },
    { prefix: '' },
  );
}

import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { rateLimitConfig } from '@/config/rate-limits';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';

import { cancelPurchaseOrderController } from './v1-cancel-purchase-order.controller';
import { createPurchaseOrderController } from './v1-create-purchase-order.controller';
import { getPurchaseOrderByIdController } from './v1-get-purchase-order-by-id.controller';
import { listPurchaseOrdersController } from './v1-list-purchase-orders.controller';

export async function purchaseOrdersRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('STOCK'));

  // Manager routes com rate limit de mutação
  app.register(
    async (managerApp) => {
      managerApp.register(rateLimit, rateLimitConfig.mutation);
      managerApp.register(createPurchaseOrderController);
      managerApp.register(cancelPurchaseOrderController);
    },
    { prefix: '' },
  );

  // Authenticated routes com rate limit de consulta
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(getPurchaseOrderByIdController);
      queryApp.register(listPurchaseOrdersController);
    },
    { prefix: '' },
  );
}

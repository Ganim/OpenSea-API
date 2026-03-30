import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { v1CreatePPEItemController } from './v1-create-ppe-item.controller';
import { v1ListPPEItemsController } from './v1-list-ppe-items.controller';
import { v1GetPPEItemController } from './v1-get-ppe-item.controller';
import { v1UpdatePPEItemController } from './v1-update-ppe-item.controller';
import { v1DeletePPEItemController } from './v1-delete-ppe-item.controller';
import { v1AdjustPPEItemStockController } from './v1-adjust-ppe-item-stock.controller';

export async function ppeItemsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('HR'));

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1CreatePPEItemController);
      mutationApp.register(v1UpdatePPEItemController);
      mutationApp.register(v1DeletePPEItemController);
      mutationApp.register(v1AdjustPPEItemStockController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1ListPPEItemsController);
      queryApp.register(v1GetPPEItemController);
    },
    { prefix: '' },
  );
}

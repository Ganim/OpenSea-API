import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { createPriceTableController } from './v1-create-price-table.controller';
import { deletePriceTableController } from './v1-delete-price-table.controller';
import { getPriceTableByIdController } from './v1-get-price-table-by-id.controller';
import { listPriceTablesController } from './v1-list-price-tables.controller';
import { updatePriceTableController } from './v1-update-price-table.controller';
import { upsertPriceTableItemController } from './v1-upsert-price-table-item.controller';
import { listPriceTableItemsController } from './v1-list-price-table-items.controller';
import { resolvePriceController } from './v1-resolve-price.controller';

export async function priceTablesRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  // Admin routes with elevated rate limit
  app.register(
    async (adminApp) => {
      adminApp.register(rateLimit, rateLimitConfig.admin);
      adminApp.register(deletePriceTableController);
    },
    { prefix: '' },
  );

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(createPriceTableController);
      mutationApp.register(updatePriceTableController);
      mutationApp.register(upsertPriceTableItemController);
      mutationApp.register(resolvePriceController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(getPriceTableByIdController);
      queryApp.register(listPriceTablesController);
      queryApp.register(listPriceTableItemsController);
    },
    { prefix: '' },
  );
}

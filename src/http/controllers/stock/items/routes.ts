import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import { getItemByIdController } from './v1-get-item-by-id.controller';
import { listItemsByProductIdController } from './v1-list-items-by-product-id.controller';
import { listItemsByVariantIdController } from './v1-list-items-by-variant-id.controller';
import { listItemsController } from './v1-list-items.controller';
import { registerItemEntryController } from './v1-register-item-entry.controller';
import { registerItemExitController } from './v1-register-item-exit.controller';
import { transferItemController } from './v1-transfer-item.controller';

export async function itemsRoutes(app: FastifyInstance) {
  // Rotas de consulta com rate limit de query
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(getItemByIdController);
      queryApp.register(listItemsController);
      queryApp.register(listItemsByVariantIdController);
      queryApp.register(listItemsByProductIdController);
    },
    { prefix: '' },
  );

  // Rotas de mutação com rate limit específico
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(registerItemEntryController);
      mutationApp.register(registerItemExitController);
      mutationApp.register(transferItemController);
    },
    { prefix: '' },
  );
}

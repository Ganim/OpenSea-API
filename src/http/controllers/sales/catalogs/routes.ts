import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { createCatalogController } from './v1-create-catalog.controller';
import { listCatalogsController } from './v1-list-catalogs.controller';
import { getCatalogByIdController } from './v1-get-catalog-by-id.controller';
import { updateCatalogController } from './v1-update-catalog.controller';
import { deleteCatalogController } from './v1-delete-catalog.controller';
import { addCatalogItemController } from './v1-add-catalog-item.controller';
import { removeCatalogItemController } from './v1-remove-catalog-item.controller';

export async function catalogsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  // Admin routes with elevated rate limit
  app.register(
    async (adminApp) => {
      adminApp.register(rateLimit, rateLimitConfig.admin);
      adminApp.register(deleteCatalogController);
    },
    { prefix: '' },
  );

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(createCatalogController);
      mutationApp.register(updateCatalogController);
      mutationApp.register(addCatalogItemController);
      mutationApp.register(removeCatalogItemController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(listCatalogsController);
      queryApp.register(getCatalogByIdController);
    },
    { prefix: '' },
  );
}

import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { rateLimitConfig } from '@/config/rate-limits';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { createCategoryController } from './v1-create-category.controller';
import { deleteCategoryController } from './v1-delete-category.controller';
import { getCategoryByIdController } from './v1-get-category-by-id.controller';
import { listCategoriesController } from './v1-list-categories.controller';
import { reorderCategoriesController } from './v1-reorder-categories.controller';
import { updateCategoryController } from './v1-update-category.controller';

export async function categoriesRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('STOCK'));

  // Admin routes com rate limit elevado
  app.register(
    async (adminApp) => {
      adminApp.register(rateLimit, rateLimitConfig.admin);
      adminApp.register(deleteCategoryController);
    },
    { prefix: '' },
  );

  // Manager routes com rate limit de mutação
  app.register(
    async (managerApp) => {
      managerApp.register(rateLimit, rateLimitConfig.mutation);
      managerApp.register(createCategoryController);
      managerApp.register(updateCategoryController);
      managerApp.register(reorderCategoriesController);
    },
    { prefix: '' },
  );

  // Authenticated routes com rate limit de consulta
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(getCategoryByIdController);
      queryApp.register(listCategoriesController);
    },
    { prefix: '' },
  );
}

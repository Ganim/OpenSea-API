import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';

import { createFinanceCategoryController } from './v1-create-finance-category.controller';
import { deleteFinanceCategoryController } from './v1-delete-finance-category.controller';
import { getFinanceCategoryByIdController } from './v1-get-finance-category-by-id.controller';
import { listFinanceCategoriesController } from './v1-list-finance-categories.controller';
import { updateFinanceCategoryController } from './v1-update-finance-category.controller';

export async function financeCategoriesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('FINANCE'));

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(getFinanceCategoryByIdController);
      queryApp.register(listFinanceCategoriesController);
    },
    { prefix: '' },
  );

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.financeMutation);
      mutationApp.register(createFinanceCategoryController);
      mutationApp.register(updateFinanceCategoryController);
      mutationApp.register(deleteFinanceCategoryController);
    },
    { prefix: '' },
  );
}

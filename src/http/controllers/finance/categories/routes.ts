import type { FastifyInstance } from 'fastify';

import { createFinanceCategoryController } from './v1-create-finance-category.controller';
import { deleteFinanceCategoryController } from './v1-delete-finance-category.controller';
import { getFinanceCategoryByIdController } from './v1-get-finance-category-by-id.controller';
import { listFinanceCategoriesController } from './v1-list-finance-categories.controller';
import { updateFinanceCategoryController } from './v1-update-finance-category.controller';

export async function financeCategoriesRoutes(app: FastifyInstance) {
  app.register(getFinanceCategoryByIdController);
  app.register(listFinanceCategoriesController);
  app.register(createFinanceCategoryController);
  app.register(updateFinanceCategoryController);
  app.register(deleteFinanceCategoryController);
}

import { app } from '@/app';
import { createCategoryController } from './v1-create-category.controller';
import { deleteCategoryController } from './v1-delete-category.controller';
import { getCategoryByIdController } from './v1-get-category-by-id.controller';
import { listCategoriesController } from './v1-list-categories.controller';
import { updateCategoryController } from './v1-update-category.controller';

export async function categoriesRoutes() {
  // Manager routes
  app.register(createCategoryController);
  app.register(updateCategoryController);
  app.register(deleteCategoryController);

  // Authenticated routes
  app.register(getCategoryByIdController);
  app.register(listCategoriesController);
}

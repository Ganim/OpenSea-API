import { app } from '@/app';
import { createProductController } from './v1-create-product.controller';
import { deleteProductController } from './v1-delete-product.controller';
import { getProductByIdController } from './v1-get-product-by-id.controller';
import { listProductsController } from './v1-list-products.controller';
import { updateProductController } from './v1-update-product.controller';

export async function productsRoutes() {
  // Admin routes
  app.register(deleteProductController);

  // Manager routes
  app.register(createProductController);
  app.register(updateProductController);

  // Authenticated routes
  app.register(getProductByIdController);
  app.register(listProductsController);
}

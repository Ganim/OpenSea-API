import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { bulkCreateProductsController } from './v1-bulk-create-products.controller';
import { createProductController } from './v1-create-product.controller';
import { deleteProductController } from './v1-delete-product.controller';
import { getProductByIdController } from './v1-get-product-by-id.controller';
import { listProductsController } from './v1-list-products.controller';
import { updateProductController } from './v1-update-product.controller';
import { validateBulkProductsController } from './v1-validate-bulk-products.controller';

export async function productsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('STOCK'));

  // Admin routes com rate limit elevado
  app.register(
    async (adminApp) => {
      adminApp.register(rateLimit, rateLimitConfig.admin);
      adminApp.register(deleteProductController);
    },
    { prefix: '' },
  );

  // Manager routes com rate limit de mutação
  app.register(
    async (managerApp) => {
      managerApp.register(rateLimit, rateLimitConfig.mutation);
      managerApp.register(createProductController);
      managerApp.register(bulkCreateProductsController);
      managerApp.register(validateBulkProductsController);
      managerApp.register(updateProductController);
    },
    { prefix: '' },
  );

  // Authenticated routes com rate limit de consulta
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(getProductByIdController);
      queryApp.register(listProductsController);
    },
    { prefix: '' },
  );
}

import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { createCustomerPriceController } from './v1-create-customer-price.controller';
import { deleteCustomerPriceController } from './v1-delete-customer-price.controller';
import { listCustomerPricesController } from './v1-list-customer-prices.controller';
import { updateCustomerPriceController } from './v1-update-customer-price.controller';

export async function customerPricesRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  // Admin routes with elevated rate limit
  app.register(
    async (adminApp) => {
      adminApp.register(rateLimit, rateLimitConfig.admin);
      adminApp.register(deleteCustomerPriceController);
    },
    { prefix: '' },
  );

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(createCustomerPriceController);
      mutationApp.register(updateCustomerPriceController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(listCustomerPricesController);
    },
    { prefix: '' },
  );
}

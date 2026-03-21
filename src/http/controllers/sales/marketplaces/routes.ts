import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import rateLimit from '@fastify/rate-limit';
import { rateLimitConfig } from '@/config/rate-limits';

// Connections
import { createConnectionController } from './connections/v1-create-connection.controller';
import { listConnectionsController } from './connections/v1-list-connections.controller';
import { getConnectionByIdController } from './connections/v1-get-connection-by-id.controller';
import { updateConnectionController } from './connections/v1-update-connection.controller';
import { deleteConnectionController } from './connections/v1-delete-connection.controller';

// Listings
import { publishListingController } from './listings/v1-publish-listing.controller';
import { listListingsController } from './listings/v1-list-listings.controller';
import { deactivateListingController } from './listings/v1-deactivate-listing.controller';

// Orders
import { listMarketplaceOrdersController } from './orders/v1-list-marketplace-orders.controller';
import { acknowledgeOrderController } from './orders/v1-acknowledge-order.controller';

// Payments
import { listPaymentsController } from './payments/v1-list-payments.controller';
import { getReconciliationController } from './payments/v1-get-reconciliation.controller';

export async function marketplacesRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  // Admin routes with elevated rate limit
  app.register(
    async (adminApp) => {
      adminApp.register(rateLimit, rateLimitConfig.admin);
      adminApp.register(deleteConnectionController);
    },
    { prefix: '' },
  );

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(createConnectionController);
      mutationApp.register(updateConnectionController);
      mutationApp.register(publishListingController);
      mutationApp.register(deactivateListingController);
      mutationApp.register(acknowledgeOrderController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(listConnectionsController);
      queryApp.register(getConnectionByIdController);
      queryApp.register(listListingsController);
      queryApp.register(listMarketplaceOrdersController);
      queryApp.register(listPaymentsController);
      queryApp.register(getReconciliationController);
    },
    { prefix: '' },
  );
}

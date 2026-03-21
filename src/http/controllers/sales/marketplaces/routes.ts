import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { v1CreateConnectionController } from './connections/v1-create-connection.controller';
import { v1ListConnectionsController } from './connections/v1-list-connections.controller';
import { v1GetConnectionByIdController } from './connections/v1-get-connection-by-id.controller';
import { v1UpdateConnectionController } from './connections/v1-update-connection.controller';
import { v1DeleteConnectionController } from './connections/v1-delete-connection.controller';
import { v1ListListingsController } from './listings/v1-list-listings.controller';
import { v1PublishListingController } from './listings/v1-publish-listing.controller';
import { v1DeactivateListingController } from './listings/v1-deactivate-listing.controller';
import { v1ListMarketplaceOrdersController } from './orders/v1-list-marketplace-orders.controller';
import { v1AcknowledgeOrderController } from './orders/v1-acknowledge-order.controller';
import { v1ListMarketplacePaymentsController } from './payments/v1-list-marketplace-payments.controller';
import { v1GetReconciliationController } from './payments/v1-get-reconciliation.controller';

export async function marketplacesRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  await app.register(v1CreateConnectionController);
  await app.register(v1ListConnectionsController);
  await app.register(v1GetConnectionByIdController);
  await app.register(v1UpdateConnectionController);
  await app.register(v1DeleteConnectionController);
  await app.register(v1ListListingsController);
  await app.register(v1PublishListingController);
  await app.register(v1DeactivateListingController);
  await app.register(v1ListMarketplaceOrdersController);
  await app.register(v1AcknowledgeOrderController);
  await app.register(v1ListMarketplacePaymentsController);
  await app.register(v1GetReconciliationController);
}

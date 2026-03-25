import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { v1CreateConnectionController } from './connections/v1-create-connection.controller';
import { v1ListConnectionsController } from './connections/v1-list-connections.controller';
import { v1GetConnectionByIdController } from './connections/v1-get-connection-by-id.controller';
import { v1UpdateConnectionController } from './connections/v1-update-connection.controller';
import { v1DeleteConnectionController } from './connections/v1-delete-connection.controller';
import { v1ConnectMarketplaceController } from './connections/v1-connect-marketplace.controller';
import { v1OauthCallbackController } from './connections/v1-oauth-callback.controller';
import { v1ListListingsController } from './listings/v1-list-listings.controller';
import { v1PublishListingController } from './listings/v1-publish-listing.controller';
import { v1DeactivateListingController } from './listings/v1-deactivate-listing.controller';
import { v1SyncProductsController } from './listings/v1-sync-products.controller';
import { v1SyncInventoryController } from './listings/v1-sync-inventory.controller';
import { v1ListMarketplaceOrdersController } from './orders/v1-list-marketplace-orders.controller';
import { v1AcknowledgeOrderController } from './orders/v1-acknowledge-order.controller';
import { v1ImportOrdersController } from './orders/v1-import-orders.controller';
import { v1ListMarketplacePaymentsController } from './payments/v1-list-marketplace-payments.controller';
import { v1GetReconciliationController } from './payments/v1-get-reconciliation.controller';
import { v1WebhookMlController } from './webhooks/v1-webhook-ml.controller';
import { v1WebhookShopeeController } from './webhooks/v1-webhook-shopee.controller';

export async function marketplacesRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  // Connections
  await app.register(v1CreateConnectionController);
  await app.register(v1ListConnectionsController);
  await app.register(v1GetConnectionByIdController);
  await app.register(v1UpdateConnectionController);
  await app.register(v1DeleteConnectionController);
  await app.register(v1ConnectMarketplaceController);
  await app.register(v1OauthCallbackController);

  // Listings
  await app.register(v1ListListingsController);
  await app.register(v1PublishListingController);
  await app.register(v1DeactivateListingController);
  await app.register(v1SyncProductsController);
  await app.register(v1SyncInventoryController);

  // Orders
  await app.register(v1ListMarketplaceOrdersController);
  await app.register(v1AcknowledgeOrderController);
  await app.register(v1ImportOrdersController);

  // Payments
  await app.register(v1ListMarketplacePaymentsController);
  await app.register(v1GetReconciliationController);

  // Webhooks (public, no auth)
  await app.register(v1WebhookMlController);
  await app.register(v1WebhookShopeeController);
}

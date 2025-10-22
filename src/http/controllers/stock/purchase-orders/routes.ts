import { FastifyInstance } from 'fastify';

import { cancelPurchaseOrderController } from './v1-cancel-purchase-order.controller';
import { createPurchaseOrderController } from './v1-create-purchase-order.controller';
import { getPurchaseOrderByIdController } from './v1-get-purchase-order-by-id.controller';
import { listPurchaseOrdersController } from './v1-list-purchase-orders.controller';

export async function purchaseOrdersRoutes(app: FastifyInstance) {
  // Create
  app.register(createPurchaseOrderController);

  // Read
  app.register(getPurchaseOrderByIdController);
  app.register(listPurchaseOrdersController);

  // Update
  app.register(cancelPurchaseOrderController);
}

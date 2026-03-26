import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { v1CancelSalesOrderController } from './v1-cancel-sales-order.controller';
import { v1CreateSalesOrderController } from './v1-create-sales-order.controller';
import { v1GetSalesOrderByIdController } from './v1-get-sales-order-by-id.controller';
import { v1ListSalesOrdersController } from './v1-list-sales-orders.controller';
import { v1UpdateSalesOrderStatusController } from './v1-update-sales-order-status.controller';

/**
 * @deprecated These `/v1/sales-orders` endpoints are legacy. The primary order
 * endpoints live at `/v1/orders` (see `src/http/controllers/sales/orders/routes.ts`).
 * The frontend exclusively uses `/v1/orders`. These routes are kept for backward
 * compatibility with external integrations and should not be used for new development.
 */
export async function salesOrdersRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  await app.register(v1GetSalesOrderByIdController);
  await app.register(v1ListSalesOrdersController);
  await app.register(v1CreateSalesOrderController);
  await app.register(v1UpdateSalesOrderStatusController);
  await app.register(v1CancelSalesOrderController);
}

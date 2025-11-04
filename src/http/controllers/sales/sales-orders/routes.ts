import type { FastifyInstance } from 'fastify';
import { v1CancelSalesOrderController } from './v1-cancel-sales-order.controller';
import { v1CreateSalesOrderController } from './v1-create-sales-order.controller';
import { v1GetSalesOrderByIdController } from './v1-get-sales-order-by-id.controller';
import { v1ListSalesOrdersController } from './v1-list-sales-orders.controller';
import { v1UpdateSalesOrderStatusController } from './v1-update-sales-order-status.controller';

export async function salesOrdersRoutes(app: FastifyInstance) {
  await app.register(v1GetSalesOrderByIdController);
  await app.register(v1ListSalesOrdersController);
  await app.register(v1CreateSalesOrderController);
  await app.register(v1UpdateSalesOrderStatusController);
  await app.register(v1CancelSalesOrderController);
}

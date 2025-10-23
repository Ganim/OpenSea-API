import { verifyJwt } from '@/http/middlewares/verify-jwt';
import type { FastifyInstance } from 'fastify';
import { v1CancelSalesOrderController } from './v1-cancel-sales-order.controller';
import { v1CreateSalesOrderController } from './v1-create-sales-order.controller';
import { v1GetSalesOrderByIdController } from './v1-get-sales-order-by-id.controller';
import { v1ListSalesOrdersController } from './v1-list-sales-orders.controller';
import { v1UpdateSalesOrderStatusController } from './v1-update-sales-order-status.controller';

export async function salesOrdersRoutes(app: FastifyInstance) {
  app.post(
    '/v1/sales-orders',
    {
      onRequest: [verifyJwt],
      schema: v1CreateSalesOrderController.schema,
    },
    v1CreateSalesOrderController,
  );

  app.get(
    '/v1/sales-orders/:id',
    {
      onRequest: [verifyJwt],
      schema: v1GetSalesOrderByIdController.schema,
    },
    v1GetSalesOrderByIdController,
  );

  app.get(
    '/v1/sales-orders',
    {
      onRequest: [verifyJwt],
      schema: v1ListSalesOrdersController.schema,
    },
    v1ListSalesOrdersController,
  );

  app.patch(
    '/v1/sales-orders/:id/status',
    {
      onRequest: [verifyJwt],
      schema: v1UpdateSalesOrderStatusController.schema,
    },
    v1UpdateSalesOrderStatusController,
  );

  app.patch(
    '/v1/sales-orders/:id/cancel',
    {
      onRequest: [verifyJwt],
      schema: v1CancelSalesOrderController.schema,
    },
    v1CancelSalesOrderController,
  );
}

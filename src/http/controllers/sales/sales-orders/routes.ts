import { rateLimitConfig } from '@/config/rate-limits';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import { v1CancelSalesOrderController } from './v1-cancel-sales-order.controller';
import { v1CreateSalesOrderController } from './v1-create-sales-order.controller';
import { v1GetSalesOrderByIdController } from './v1-get-sales-order-by-id.controller';
import { v1ListSalesOrdersController } from './v1-list-sales-orders.controller';
import { v1UpdateSalesOrderStatusController } from './v1-update-sales-order-status.controller';

export async function salesOrdersRoutes(app: FastifyInstance) {
  // Rotas de consulta com rate limit de query
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);

      queryApp.get(
        '/v1/sales-orders/:id',
        {
          onRequest: [verifyJwt],
          schema: v1GetSalesOrderByIdController.schema,
        },
        v1GetSalesOrderByIdController,
      );

      queryApp.get(
        '/v1/sales-orders',
        {
          onRequest: [verifyJwt],
          schema: v1ListSalesOrdersController.schema,
        },
        v1ListSalesOrdersController,
      );
    },
    { prefix: '' },
  );

  // Rotas de mutação com rate limit específico
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);

      mutationApp.post(
        '/v1/sales-orders',
        {
          onRequest: [verifyJwt],
          schema: v1CreateSalesOrderController.schema,
        },
        v1CreateSalesOrderController,
      );

      mutationApp.patch(
        '/v1/sales-orders/:id/status',
        {
          onRequest: [verifyJwt],
          schema: v1UpdateSalesOrderStatusController.schema,
        },
        v1UpdateSalesOrderStatusController,
      );

      mutationApp.patch(
        '/v1/sales-orders/:id/cancel',
        {
          onRequest: [verifyJwt],
          schema: v1CancelSalesOrderController.schema,
        },
        v1CancelSalesOrderController,
      );
    },
    { prefix: '' },
  );
}

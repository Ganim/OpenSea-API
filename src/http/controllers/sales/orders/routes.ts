import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { v1CreateOrderController } from './v1-create-order.controller';
import { v1ListOrdersController } from './v1-list-orders.controller';
import { v1GetOrderByIdController } from './v1-get-order-by-id.controller';
import { v1UpdateOrderController } from './v1-update-order.controller';
import { v1DeleteOrderController } from './v1-delete-order.controller';
import { v1ConfirmOrderController } from './v1-confirm-order.controller';
import { v1CancelOrderController } from './v1-cancel-order.controller';
import { v1ChangeOrderStageController } from './v1-change-order-stage.controller';
import { v1ConvertQuoteController } from './v1-convert-quote.controller';

export async function ordersRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  await app.register(v1ListOrdersController);
  await app.register(v1GetOrderByIdController);
  await app.register(v1CreateOrderController);
  await app.register(v1UpdateOrderController);
  await app.register(v1DeleteOrderController);
  await app.register(v1ConfirmOrderController);
  await app.register(v1CancelOrderController);
  await app.register(v1ChangeOrderStageController);
  await app.register(v1ConvertQuoteController);
}

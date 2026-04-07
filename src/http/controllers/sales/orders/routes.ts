import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import type { FastifyInstance } from 'fastify';
import { v1AddOrderItemController } from './v1-add-order-item.controller';
import { v1CancelOrderController } from './v1-cancel-order.controller';
import { v1ChangeOrderStageController } from './v1-change-order-stage.controller';
import { v1ClaimOrderController } from './v1-claim-order.controller';
import { v1ConfirmOrderController } from './v1-confirm-order.controller';
import { v1ConvertQuoteController } from './v1-convert-quote.controller';
import { v1CreateOrderController } from './v1-create-order.controller';
import { v1CreatePdvOrderController } from './v1-create-pdv-order.controller';
import { v1DeleteOrderController } from './v1-delete-order.controller';
import { v1FindVariantByScanCodeController } from './v1-find-variant-by-scan-code.controller';
import { v1GetCashierQueueController } from './v1-get-cashier-queue.controller';
import { v1GetMyDraftsController } from './v1-get-my-drafts.controller';
import { v1GetOrderByCodeController } from './v1-get-order-by-code.controller';
import { v1GetOrderByIdController } from './v1-get-order-by-id.controller';
import { v1ListOrdersController } from './v1-list-orders.controller';
import { v1ReceivePaymentController } from './v1-receive-payment.controller';
import { v1RemoveOrderItemController } from './v1-remove-order-item.controller';
import { v1SendToCashierController } from './v1-send-to-cashier.controller';
import { v1SyncOfflineOrdersController } from './v1-sync-offline-orders.controller';
import { v1UpdateOrderItemController } from './v1-update-order-item.controller';
import { v1UpdateOrderController } from './v1-update-order.controller';

export async function ordersRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  // --- Static routes (must be registered before dynamic /:id routes) ---
  await app.register(v1ListOrdersController);
  await app.register(v1CreateOrderController);
  await app.register(v1CreatePdvOrderController);
  await app.register(v1GetCashierQueueController);
  await app.register(v1GetMyDraftsController);
  await app.register(v1GetOrderByCodeController);
  await app.register(v1FindVariantByScanCodeController);
  await app.register(v1SyncOfflineOrdersController);

  // --- Dynamic routes (with :id param) ---
  await app.register(v1GetOrderByIdController);
  await app.register(v1UpdateOrderController);
  await app.register(v1DeleteOrderController);
  await app.register(v1ConfirmOrderController);
  await app.register(v1CancelOrderController);
  await app.register(v1ChangeOrderStageController);
  await app.register(v1ConvertQuoteController);
  await app.register(v1AddOrderItemController);
  await app.register(v1RemoveOrderItemController);
  await app.register(v1UpdateOrderItemController);
  await app.register(v1SendToCashierController);
  await app.register(v1ClaimOrderController);
  await app.register(v1ReceivePaymentController);
}

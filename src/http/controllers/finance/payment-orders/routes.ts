import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';

import { createPaymentOrderController } from './v1-create-payment-order.controller';
import { listPaymentOrdersController } from './v1-list-payment-orders.controller';
import { getPaymentOrderController } from './v1-get-payment-order.controller';
import { approvePaymentOrderController } from './v1-approve-payment-order.controller';
import { rejectPaymentOrderController } from './v1-reject-payment-order.controller';
import { getPaymentReceiptController } from './v1-get-payment-receipt.controller';

export async function paymentOrdersRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('FINANCE'));

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(listPaymentOrdersController);
      queryApp.register(getPaymentOrderController);
      queryApp.register(getPaymentReceiptController);
    },
    { prefix: '' },
  );

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.financeMutation);
      mutationApp.register(createPaymentOrderController);
      mutationApp.register(rejectPaymentOrderController);
    },
    { prefix: '' },
  );

  // Approval routes — uses financeWebhook limit (heavy: triggers real bank payment)
  app.register(
    async (approvalApp) => {
      approvalApp.register(rateLimit, rateLimitConfig.financeWebhook);
      approvalApp.register(approvePaymentOrderController);
    },
    { prefix: '' },
  );
}

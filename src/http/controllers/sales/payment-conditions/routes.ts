import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { v1CreatePaymentConditionController } from './v1-create-payment-condition.controller';
import { v1ListPaymentConditionsController } from './v1-list-payment-conditions.controller';
import { v1UpdatePaymentConditionController } from './v1-update-payment-condition.controller';
import { v1DeletePaymentConditionController } from './v1-delete-payment-condition.controller';

export async function paymentConditionsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  await app.register(v1ListPaymentConditionsController);
  await app.register(v1CreatePaymentConditionController);
  await app.register(v1UpdatePaymentConditionController);
  await app.register(v1DeletePaymentConditionController);
}

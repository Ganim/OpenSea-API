import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { v1GetPaymentConfigController } from './v1-get-payment-config.controller';
import { v1SavePaymentConfigController } from './v1-save-payment-config.controller';
import { v1TestPaymentConnectionController } from './v1-test-payment-connection.controller';
import { v1GetProvidersController } from './v1-get-providers.controller';

export async function paymentConfigRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  // Static routes first
  await app.register(v1GetPaymentConfigController);
  await app.register(v1SavePaymentConfigController);
  await app.register(v1TestPaymentConnectionController);
  await app.register(v1GetProvidersController);
}

import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { v1CreateChargeController } from './v1-create-charge.controller';
import { v1CheckChargeStatusController } from './v1-check-charge-status.controller';

export async function paymentChargesRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  // Static routes first
  await app.register(v1CreateChargeController);

  // Dynamic routes (with :id param)
  await app.register(v1CheckChargeStatusController);
}

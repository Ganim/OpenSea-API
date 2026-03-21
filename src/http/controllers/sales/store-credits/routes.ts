import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { v1GetStoreCreditBalanceController } from './v1-get-balance.controller';
import { v1CreateStoreCreditController } from './v1-create-store-credit.controller';

export async function storeCreditsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  await app.register(v1GetStoreCreditBalanceController);
  await app.register(v1CreateStoreCreditController);
}

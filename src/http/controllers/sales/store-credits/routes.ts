import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { v1ListStoreCreditsController } from './v1-list-store-credits.controller';
import { v1GetStoreCreditBalanceController } from './v1-get-balance.controller';
import { v1CreateStoreCreditController } from './v1-create-store-credit.controller';
import { v1GetStoreCreditByIdController } from './v1-get-store-credit-by-id.controller';
import { v1DeleteStoreCreditController } from './v1-delete-store-credit.controller';

export async function storeCreditsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  // Static routes first (before parametric :storeCreditId)
  await app.register(v1ListStoreCreditsController);
  await app.register(v1GetStoreCreditBalanceController);
  await app.register(v1CreateStoreCreditController);

  // Parametric routes
  await app.register(v1GetStoreCreditByIdController);
  await app.register(v1DeleteStoreCreditController);
}

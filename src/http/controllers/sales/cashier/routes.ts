import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { listCashierSessionsController } from './v1-list-cashier-sessions.controller';

export async function salesCashierRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  await app.register(listCashierSessionsController);
}

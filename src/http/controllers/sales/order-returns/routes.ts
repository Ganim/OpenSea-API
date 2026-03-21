import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { v1CreateReturnController } from './v1-create-return.controller';
import { v1ListReturnsController } from './v1-list-returns.controller';
import { v1ApproveReturnController } from './v1-approve-return.controller';

export async function orderReturnsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  await app.register(v1ListReturnsController);
  await app.register(v1CreateReturnController);
  await app.register(v1ApproveReturnController);
}

import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { listCareOptionsController } from './v1-list-care-options.controller';

export async function careRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('STOCK'));

  await app.register(listCareOptionsController);
}

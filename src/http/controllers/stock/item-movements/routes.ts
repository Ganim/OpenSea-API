import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { listItemMovementsController } from './v1-list-item-movements.controller';

export async function itemMovementsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('STOCK'));

  app.register(listItemMovementsController);
}

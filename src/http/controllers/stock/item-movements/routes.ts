import type { FastifyInstance } from 'fastify';
import { listItemMovementsController } from './v1-list-item-movements.controller';

export async function itemMovementsRoutes(app: FastifyInstance) {
  app.register(listItemMovementsController);
}

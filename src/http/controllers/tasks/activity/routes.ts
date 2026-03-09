import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';

import { listBoardActivityController } from './v1-list-board-activity.controller';
import { listCardActivityController } from './v1-list-card-activity.controller';

export async function taskActivityRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('TASKS'));

  app.register(listCardActivityController);
  app.register(listBoardActivityController);
}

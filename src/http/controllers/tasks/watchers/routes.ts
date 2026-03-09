import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';

import { watchCardController } from './v1-watch-card.controller';
import { unwatchCardController } from './v1-unwatch-card.controller';
import { listCardWatchersController } from './v1-list-card-watchers.controller';

export async function taskWatchersRoutes(app: FastifyInstance) {
app.addHook('onRequest', createModuleMiddleware('TASKS'));

  app.register(watchCardController);
  app.register(unwatchCardController);
  app.register(listCardWatchersController);
}

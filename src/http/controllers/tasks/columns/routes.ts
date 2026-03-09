import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';

import { createColumnController } from './v1-create-column.controller';
import { deleteColumnController } from './v1-delete-column.controller';
import { reorderColumnsController } from './v1-reorder-columns.controller';
import { updateColumnController } from './v1-update-column.controller';

export async function taskColumnsRoutes(app: FastifyInstance) {
app.addHook('onRequest', createModuleMiddleware('TASKS'));

  app.register(reorderColumnsController);
  app.register(createColumnController);
  app.register(updateColumnController);
  app.register(deleteColumnController);
}

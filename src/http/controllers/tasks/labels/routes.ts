import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';

import { createLabelController } from './v1-create-label.controller';
import { deleteLabelController } from './v1-delete-label.controller';
import { listLabelsController } from './v1-list-labels.controller';
import { updateLabelController } from './v1-update-label.controller';

export async function taskLabelsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('TASKS'));

  app.register(createLabelController);
  app.register(updateLabelController);
  app.register(deleteLabelController);
  app.register(listLabelsController);
}

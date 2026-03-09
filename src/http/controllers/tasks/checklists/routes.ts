import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';

import { addChecklistItemController } from './v1-add-checklist-item.controller';
import { createChecklistController } from './v1-create-checklist.controller';
import { deleteChecklistController } from './v1-delete-checklist.controller';
import { removeChecklistItemController } from './v1-remove-checklist-item.controller';
import { toggleChecklistItemController } from './v1-toggle-checklist-item.controller';
import { updateChecklistController } from './v1-update-checklist.controller';

export async function taskChecklistsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('TASKS'));

  app.register(createChecklistController);
  app.register(updateChecklistController);
  app.register(deleteChecklistController);
  app.register(addChecklistItemController);
  app.register(toggleChecklistItemController);
  app.register(removeChecklistItemController);
}

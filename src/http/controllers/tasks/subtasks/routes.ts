import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';

import { completeSubtaskController } from './v1-complete-subtask.controller';
import { createSubtaskController } from './v1-create-subtask.controller';
import { deleteSubtaskController } from './v1-delete-subtask.controller';
import { listSubtasksController } from './v1-list-subtasks.controller';
import { updateSubtaskController } from './v1-update-subtask.controller';

export async function taskSubtasksRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('TASKS'));

  app.register(createSubtaskController);
  app.register(updateSubtaskController);
  app.register(deleteSubtaskController);
  app.register(listSubtasksController);
  app.register(completeSubtaskController);
}

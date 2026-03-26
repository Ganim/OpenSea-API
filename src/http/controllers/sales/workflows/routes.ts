import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { createWorkflowController } from './v1-create-workflow.controller';
import { deleteWorkflowController } from './v1-delete-workflow.controller';
import { getWorkflowByIdController } from './v1-get-workflow-by-id.controller';
import { listWorkflowsController } from './v1-list-workflows.controller';
import { updateWorkflowController } from './v1-update-workflow.controller';
import { activateWorkflowController } from './v1-activate-workflow.controller';
import { deactivateWorkflowController } from './v1-deactivate-workflow.controller';
import { executeWorkflowController } from './v1-execute-workflow.controller';

export async function workflowsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  await app.register(listWorkflowsController);
  await app.register(getWorkflowByIdController);
  await app.register(createWorkflowController);
  await app.register(updateWorkflowController);
  await app.register(deleteWorkflowController);
  await app.register(activateWorkflowController);
  await app.register(deactivateWorkflowController);
  await app.register(executeWorkflowController);
}

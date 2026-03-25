import type { FastifyInstance } from 'fastify';

import { createWorkflowController } from './v1-create-workflow.controller';
import { listWorkflowsController } from './v1-list-workflows.controller';
import { getWorkflowController } from './v1-get-workflow.controller';
import { updateWorkflowController } from './v1-update-workflow.controller';
import { deleteWorkflowController } from './v1-delete-workflow.controller';
import { runWorkflowController } from './v1-run-workflow.controller';
import { listExecutionsController } from './v1-list-executions.controller';

export async function aiWorkflowsRoutes(app: FastifyInstance) {
  app.register(createWorkflowController);
  app.register(listWorkflowsController);
  app.register(getWorkflowController);
  app.register(updateWorkflowController);
  app.register(deleteWorkflowController);
  app.register(runWorkflowController);
  app.register(listExecutionsController);
}

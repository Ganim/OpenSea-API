import type { FastifyInstance } from 'fastify';

import { createAutomationController } from './v1-create-automation.controller';
import { deleteAutomationController } from './v1-delete-automation.controller';
import { listAutomationsController } from './v1-list-automations.controller';
import { toggleAutomationController } from './v1-toggle-automation.controller';
import { updateAutomationController } from './v1-update-automation.controller';

export async function taskAutomationsRoutes(app: FastifyInstance) {
  app.register(createAutomationController);
  app.register(updateAutomationController);
  app.register(deleteAutomationController);
  app.register(listAutomationsController);
  app.register(toggleAutomationController);
}

import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';

import { createCardIntegrationController } from './v1-create-card-integration.controller';
import { deleteCardIntegrationController } from './v1-delete-card-integration.controller';
import { listCardIntegrationsController } from './v1-list-card-integrations.controller';

export async function taskIntegrationsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('TASKS'));

  app.register(createCardIntegrationController);
  app.register(deleteCardIntegrationController);
  app.register(listCardIntegrationsController);
}

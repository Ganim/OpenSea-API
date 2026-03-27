import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import type { FastifyInstance } from 'fastify';
import { connectIntegrationController } from './v1-connect-integration.controller';
import { disconnectIntegrationController } from './v1-disconnect-integration.controller';
import { getIntegrationByIdController } from './v1-get-integration-by-id.controller';
import { getTenantIntegrationsController } from './v1-get-tenant-integrations.controller';
import { listIntegrationsController } from './v1-list-integrations.controller';
import { syncIntegrationController } from './v1-sync-integration.controller';
import { updateIntegrationConfigController } from './v1-update-integration-config.controller';

export async function integrationsHubRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  await app.register(listIntegrationsController);
  await app.register(getIntegrationByIdController);
  await app.register(connectIntegrationController);
  await app.register(disconnectIntegrationController);
  await app.register(getTenantIntegrationsController);
  await app.register(updateIntegrationConfigController);
  await app.register(syncIntegrationController);
}

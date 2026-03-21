import type { FastifyInstance } from 'fastify';
import { createPortalAccessController } from './v1-create-portal-access.controller';
import { getPortalDataController } from './v1-get-portal-data.controller';

export async function analyticsCustomerPortalRoutes(app: FastifyInstance) {
  await app.register(createPortalAccessController);
  await app.register(getPortalDataController);
}

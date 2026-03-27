import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';

import { inviteCustomerPortalController } from './v1-invite-customer-portal.controller';
import { listCustomerPortalAccessesController } from './v1-list-customer-portal-accesses.controller';
import { revokeCustomerPortalAccessController } from './v1-revoke-customer-portal-access.controller';

export async function financeCustomerPortalRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('FINANCE'));

  app.register(inviteCustomerPortalController);
  app.register(listCustomerPortalAccessesController);
  app.register(revokeCustomerPortalAccessController);
}

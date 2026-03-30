import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';

import { inviteCustomerPortalController } from './v1-invite-customer-portal.controller';
import { listCustomerPortalAccessesController } from './v1-list-customer-portal-accesses.controller';
import { revokeCustomerPortalAccessController } from './v1-revoke-customer-portal-access.controller';

export async function financeCustomerPortalRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('FINANCE'));

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(listCustomerPortalAccessesController);
    },
    { prefix: '' },
  );

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.financeMutation);
      mutationApp.register(inviteCustomerPortalController);
      mutationApp.register(revokeCustomerPortalAccessController);
    },
    { prefix: '' },
  );
}

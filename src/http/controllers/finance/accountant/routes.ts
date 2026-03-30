import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';

import { inviteAccountantController } from './v1-invite-accountant.controller';
import { revokeAccountantController } from './v1-revoke-accountant.controller';
import { listAccountantAccessesController } from './v1-list-accountant-accesses.controller';

export async function financeAccountantRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('FINANCE'));

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(listAccountantAccessesController);
    },
    { prefix: '' },
  );

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.financeMutation);
      mutationApp.register(inviteAccountantController);
      mutationApp.register(revokeAccountantController);
    },
    { prefix: '' },
  );
}

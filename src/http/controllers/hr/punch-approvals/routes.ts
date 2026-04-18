import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { rateLimitConfig } from '@/config/rate-limits';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';

import { v1ListPunchApprovalsController } from './v1-list-punch-approvals.controller';
import { v1ResolvePunchApprovalController } from './v1-resolve-punch-approval.controller';

/**
 * Aggregator das rotas de PunchApproval (HR module scoped).
 * Espelha o pattern de `punch-devices/routes.ts`:
 * - addHook preHandler → createModuleMiddleware('HR')
 * - 2 sub-apps: mutation (rate-limit estrito) e query (rate-limit permissivo)
 */
export async function punchApprovalsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('HR'));

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1ResolvePunchApprovalController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1ListPunchApprovalsController);
    },
    { prefix: '' },
  );
}

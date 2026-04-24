import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { rateLimitConfig } from '@/config/rate-limits';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';

import { v1BatchResolvePunchApprovalsController } from './v1-batch-resolve-punch-approvals.controller';
import { v1ListPunchApprovalsController } from './v1-list-punch-approvals.controller';
import { v1ResolvePunchApprovalController } from './v1-resolve-punch-approval.controller';
import { v1UploadPunchApprovalEvidenceController } from './v1-upload-punch-approval-evidence.controller';

/**
 * Aggregator das rotas de PunchApproval (HR module scoped).
 * Espelha o pattern de `punch-devices/routes.ts`:
 * - addHook preHandler → createModuleMiddleware('HR')
 * - 2 sub-apps: mutation (rate-limit estrito) e query (rate-limit permissivo)
 *
 * Phase 7 / Plan 07-03 — D-09/D-10: dois novos controllers registrados
 * junto do resolve existente na sub-app de mutação:
 *  - POST /v1/hr/punch-approvals/batch-resolve
 *  - POST /v1/hr/punch-approvals/:id/evidence (multipart)
 */
export async function punchApprovalsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('HR'));

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1ResolvePunchApprovalController);
      mutationApp.register(v1BatchResolvePunchApprovalsController);
      mutationApp.register(v1UploadPunchApprovalEvidenceController);
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

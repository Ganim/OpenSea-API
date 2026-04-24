import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';

import { rateLimitConfig } from '@/config/rate-limits';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';

import { v1ExportPunchBatchController } from './v1-export-punch-batch.controller';

/**
 * Aggregator das rotas do Dashboard Gestor (Phase 07 / Plan 07-04+).
 *
 * Segue o pattern de `punch-approvals/routes.ts`:
 *   - `addHook preHandler` com `createModuleMiddleware('HR')` antes das rotas.
 *   - Sub-app "mutation" com `rateLimitConfig.mutation` — export de 50k rows
 *     é mutação (escreve AuditLog + enfileira job), então entra na rampa
 *     estrita.
 *
 * Plans futuros (07-05 heatmap/summary/missing, 07-06 heartbeat) adicionam
 * sub-apps "query" com rate limit permissivo.
 */
export async function punchDashboardRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('HR'));

  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1ExportPunchBatchController);
    },
    { prefix: '' },
  );
}

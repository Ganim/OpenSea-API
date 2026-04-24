import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';

import { rateLimitConfig } from '@/config/rate-limits';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';

import { v1ExportPunchBatchController } from './v1-export-punch-batch.controller';
import { punchDashboardHeatmapRoutes } from './v1-get-punch-heatmap.controller';
import { punchDashboardSummaryRoutes } from './v1-get-dashboard-summary.controller';
import { punchMissedPunchesRoutes } from './v1-list-missed-punches.controller';
import { punchDashboardCellDetailRoutes } from './v1-get-punch-cell-detail.controller';

/**
 * Aggregator das rotas do Dashboard Gestor (Phase 07 / Plan 07-04+).
 *
 * Pattern:
 *   - `addHook preHandler` com `createModuleMiddleware('HR')` antes das rotas.
 *   - Sub-app "mutation" (rate-limit estrito) — export de 50k rows.
 *   - Sub-app "query" (rate-limit permissivo) — heatmap/summary/missing/cell-detail
 *     são leituras agregadas frequentes do dashboard.
 *
 * Plan 07-05b registra os 4 controllers read-side abaixo. Aliases dos
 * controllers (`punchDashboardHeatmapRoutes`, etc.) são re-exports com
 * nome estável esperado pelos acceptance criteria do plan.
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

  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(punchDashboardHeatmapRoutes);
      queryApp.register(punchDashboardSummaryRoutes);
      queryApp.register(punchMissedPunchesRoutes);
      queryApp.register(punchDashboardCellDetailRoutes);
    },
    { prefix: '' },
  );
}

import type { FastifyInstance } from 'fastify';

import { v1ListAuditController } from './v1-list-audit.controller';
import { v1GetAuditDetailController } from './v1-get-audit-detail.controller';
import { v1GetDriftRankingController } from './v1-get-drift-ranking.controller';
import { v1MarkSuspicionController } from './v1-mark-suspicion.controller';

/**
 * Phase 9 / Plan 09-02 — Punch audit routes (sub-app).
 * GET endpoints (query) + POST mark-suspicion (mutation) with PIN gate.
 */
export async function punchAuditRoutes(app: FastifyInstance) {
  // Query endpoints (read-only, permissive rate-limit)
  await app.register(v1ListAuditController);
  await app.register(v1GetAuditDetailController);
  await app.register(v1GetDriftRankingController);

  // Mutation endpoint (strict rate-limit + PIN gate)
  await app.register(v1MarkSuspicionController);
}

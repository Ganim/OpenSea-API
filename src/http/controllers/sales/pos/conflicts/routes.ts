import type { FastifyInstance } from 'fastify';

import { v1ListConflictsController } from './v1-list-conflicts.controller';

/**
 * Registers admin endpoints for POS Order Conflicts (Emporion Plan A —
 * Task 30+). The endpoints live under `/v1/admin/pos/...` and are
 * JWT+tenant-scoped (no device token), gated by RBAC permissions.
 */
export async function posConflictsRoutes(app: FastifyInstance) {
  await app.register(v1ListConflictsController);
}

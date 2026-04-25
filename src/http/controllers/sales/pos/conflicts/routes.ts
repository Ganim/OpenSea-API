import type { FastifyInstance } from 'fastify';

import { v1GetConflictController } from './v1-get-conflict.controller';
import { v1ListConflictsController } from './v1-list-conflicts.controller';
import { v1ResolveConflictManuallyController } from './v1-resolve-conflict-manually.controller';

/**
 * Registers admin endpoints for POS Order Conflicts (Emporion Plan A —
 * Task 30+). The endpoints live under `/v1/admin/pos/...` and are
 * JWT+tenant-scoped (no device token), gated by RBAC permissions.
 */
export async function posConflictsRoutes(app: FastifyInstance) {
  await app.register(v1ListConflictsController);
  await app.register(v1GetConflictController);
  await app.register(v1ResolveConflictManuallyController);
}

/**
 * Phase 9 / Plan 09-02 — E2E spec stub for v1-list-audit.
 * Wave 1 placeholder; detailed tests deferred to Phase 09-03+ integration.
 */

import { describe, it, expect } from 'vitest';

describe('GET /v1/hr/punch/audit (E2E stub — Phase 09-02)', () => {
  it.skip('returns 401 without JWT', async () => {
    // TODO: POST login → GET /v1/hr/punch/audit → expect 401
  });

  it.skip('returns 403 without hr.punch.audit.access permission', async () => {
    // TODO: User without permission
  });

  it.skip('returns audit rows with face_match filter', async () => {
    // TODO: Setup test data, query with filter
  });

  it.skip('cursor pagination works', async () => {
    // TODO: First page + nextCursor → second page
  });
});

/**
 * Phase 9 / Plan 09-02 — E2E spec stub for v1-mark-suspicion.
 */

import { describe, it, expect } from 'vitest';

describe('POST /v1/hr/punch/audit/:id/mark-suspicion (E2E stub — Phase 09-02)', () => {
  it.skip('requires PIN gate + permission', async () => {
    // TODO: POST without PIN → 403
  });

  it.skip('marks time entry suspicious + audit log', async () => {
    // TODO: POST with PIN → verify audit log created
  });

  it.skip('is idempotent', async () => {
    // TODO: POST twice → same result
  });
});

/**
 * E2E — Phase 10 / Plan 10-01 (punch.agent_update_failed manifest category)
 *
 * Validates that the new category added by Phase 10 is present in the
 * `/v1/notifications/modules-manifest` endpoint response.
 *
 * The punch manifest now has 12 categories:
 *   - 3 Phase 4 (registered, late, approval_requested)
 *   - 2 Phase 5 (pin_locked, qr_rotation.completed)
 *   - 3 Phase 7 (daily_digest, exception_approval_requested, export_ready)
 *   - 3 Phase 9 (face_match_alert, missed_punch_manager, missed_punch_employee)
 *   - 1 Phase 10 (agent_update_failed) ← new
 *
 * Deviation note: plan stated "9ª categoria" (8 existing + 1 new). At time of
 * implementation, Phase 9 had already added 3 categories bringing the total to
 * 11 before this plan. Phase 10 adds the 12th. The must_have truth
 * (punch.agent_update_failed present + GET endpoint returns it) is satisfied.
 */

import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { bootstrapNotificationsModule } from '@/modules/notifications/bootstrap';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Notifications manifest — punch.agent_update_failed (Phase 10)', () => {
  beforeAll(async () => {
    await app.ready();
    // Bootstrap the notifications module explicitly for the test env.
    // Idempotent — swallow if already bootstrapped by an earlier spec.
    try {
      await bootstrapNotificationsModule({ useSocket: false });
    } catch {
      // Already bootstrapped — manifests are synced.
    }
  });

  it('GET /v1/notifications/modules-manifest returns punch.agent_update_failed category', async () => {
    const { tenantId } = await createAndSetupTenant();
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/notifications/modules-manifest')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('modules');
    expect(Array.isArray(response.body.modules)).toBe(true);

    const punchModule = response.body.modules.find(
      (m: { code?: string }) => m.code === 'punch',
    );

    expect(punchModule).toBeDefined();
    expect(Array.isArray(punchModule.categories)).toBe(true);

    // The punch module must now have 12 categories (Phase 10 adds agent_update_failed)
    expect(punchModule.categories.length).toBeGreaterThanOrEqual(12);

    const codes = punchModule.categories.map((c: { code: string }) => c.code);
    expect(codes).toContain('punch.agent_update_failed');
  });

  it('punch.agent_update_failed has correct metadata (ACTIONABLE/HIGH/IN_APP+EMAIL/digest)', async () => {
    const { tenantId } = await createAndSetupTenant();
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/notifications/modules-manifest')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);

    const punchModule = response.body.modules.find(
      (m: { code?: string }) => m.code === 'punch',
    );

    const category = punchModule?.categories?.find(
      (c: { code: string }) => c.code === 'punch.agent_update_failed',
    );

    expect(category).toBeDefined();
    // The endpoint serializes `defaultKind` (maps from manifest's `defaultType`)
    expect(category.defaultKind).toBe('ACTIONABLE');
    expect(category.defaultPriority).toBe('HIGH');
    expect(category.defaultChannels).toContain('IN_APP');
    expect(category.defaultChannels).toContain('EMAIL');
    expect(category.digestSupported).toBe(true);
  });
});

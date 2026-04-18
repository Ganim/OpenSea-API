/**
 * PUNCH-NOTIF-05 end-to-end verification.
 *
 * Validates that the punch notifications manifest (registered via
 * `src/modules/notifications/manifests/punch.manifest.ts` → bootstrap) is
 * discoverable through the public `GET /v1/notifications/modules-manifest`
 * endpoint so the frontend preferences UI renders the "Ponto" section.
 *
 * File name aligns with the plan's specified path
 * (`v1-get-preferences.e2e.spec.ts`) for traceability. The actual endpoint
 * that exposes the manifest is `/v1/notifications/modules-manifest`; the
 * per-user preferences endpoint (`/v1/notifications/preferences`) returns
 * user settings, not the module catalog.
 */

import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { bootstrapNotificationsModule } from '@/modules/notifications/bootstrap';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Notifications preferences — punch module visibility (PUNCH-NOTIF-05)', () => {
  beforeAll(async () => {
    await app.ready();
    // Bootstrap the notifications module explicitly for the test env.
    // In production this runs once in `server.ts`, but the e2e harness
    // initializes Fastify through `app.ready()` without going through
    // `server.ts`. Bootstrap is idempotent on subsequent calls (the
    // internal `bootstrapped` flag throws on a second invocation, which
    // we swallow so independent test files each try to bootstrap safely).
    try {
      await bootstrapNotificationsModule({ useSocket: false });
    } catch {
      // Already bootstrapped in an earlier spec — manifests are synced.
    }
  });

  it('exposes the punch module via GET /v1/notifications/modules-manifest', async () => {
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
    expect(punchModule.displayName).toBe('Ponto');
    expect(punchModule.icon).toBe('Clock');
    expect(punchModule.order).toBe(35);

    // The punch manifest declares 3 categories; assert at least the two
    // that phase 4 already emits (punch.registered, punch.approval_requested).
    expect(Array.isArray(punchModule.categories)).toBe(true);
    const codes = punchModule.categories.map((c: { code: string }) => c.code);
    expect(codes).toContain('punch.registered');
    expect(codes).toContain('punch.approval_requested');
    expect(codes).toContain('punch.late');
  });
});

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import {
  makeV2Notification,
  type NotificationKindV2,
} from '@/utils/tests/factories/notifications/make-notification';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

/**
 * Cross-tenant isolation — the v2 list endpoint filters by `tenantId` read
 * from the JWT claim. A user authenticated inside tenant A must never see
 * notifications that live under tenant B, even if the attacker knows a
 * notification id or happens to be authenticated.
 *
 * These tests hit `/v1/notifications/me` (the v2 list) because it's the
 * endpoint that applies tenant scoping explicitly — the v1 list only
 * scopes by userId.
 */
describe('v2 notifications — cross-tenant isolation (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  it('list endpoint hides notifications that belong to a different tenant', async () => {
    // Two independent tenants — each with its own authenticated user.
    const { tenantId: tenantA } = await createAndSetupTenant();
    const { tenantId: tenantB } = await createAndSetupTenant();

    const { user: userA, token: tokenA } = await createAndAuthenticateUser(
      app,
      { tenantId: tenantA },
    );
    const { user: userB } = await createAndAuthenticateUser(app, {
      tenantId: tenantB,
    });

    // Seed notifications in BOTH tenants for BOTH users.
    await makeV2Notification({
      userId: userA.user.id.toString(),
      tenantId: tenantA,
      kind: 'INFORMATIONAL',
      title: 'Tenant A — userA',
    });

    await makeV2Notification({
      userId: userB.user.id.toString(),
      tenantId: tenantB,
      kind: 'INFORMATIONAL',
      title: 'Tenant B — userB',
    });

    // Also seed a notification for userA but under tenant B, to ensure
    // user-id alone is not enough to leak through the filter.
    await makeV2Notification({
      userId: userA.user.id.toString(),
      tenantId: tenantB,
      kind: 'INFORMATIONAL',
      title: 'Tenant B — userA (leak bait)',
    });

    const response = await request(app.server)
      .get('/v1/notifications/me')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(response.statusCode).toEqual(200);
    expect(Array.isArray(response.body.notifications)).toBe(true);

    // userA should see only their own notification in tenant A.
    const titles: string[] = response.body.notifications.map(
      (n: { title: string }) => n.title,
    );
    expect(titles).toEqual(expect.arrayContaining(['Tenant A — userA']));
    expect(titles).not.toEqual(expect.arrayContaining(['Tenant B — userB']));
    expect(titles).not.toEqual(
      expect.arrayContaining(['Tenant B — userA (leak bait)']),
    );
  });

  it('list endpoint hides notifications belonging to other users within the same tenant', async () => {
    const { tenantId } = await createAndSetupTenant();

    const { user: owner } = await createAndAuthenticateUser(app, { tenantId });
    const { token: attackerToken } = await createAndAuthenticateUser(app, {
      tenantId,
    });

    await makeV2Notification({
      userId: owner.user.id.toString(),
      tenantId,
      kind: 'APPROVAL',
      title: 'Private approval',
    });

    const response = await request(app.server)
      .get('/v1/notifications/me')
      .set('Authorization', `Bearer ${attackerToken}`);

    expect(response.statusCode).toEqual(200);
    const titles: string[] = response.body.notifications.map(
      (n: { title: string }) => n.title,
    );
    expect(titles).not.toEqual(expect.arrayContaining(['Private approval']));
  });

  it('renders the full kind spectrum when seeded', async () => {
    const { tenantId } = await createAndSetupTenant();
    const { user, token } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id.toString();

    const kinds: NotificationKindV2[] = [
      'INFORMATIONAL',
      'LINK',
      'ACTIONABLE',
      'APPROVAL',
      'FORM',
      'PROGRESS',
      'SYSTEM_BANNER',
      'IMAGE_BANNER',
      'REPORT',
      'EMAIL_PREVIEW',
    ];
    for (const kind of kinds) {
      await makeV2Notification({
        userId,
        tenantId,
        kind,
        title: `kind:${kind}`,
      });
    }

    const response = await request(app.server)
      .get('/v1/notifications/me?limit=100')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    const returnedKinds = new Set<string>(
      response.body.notifications.map((n: { kind: string }) => n.kind),
    );
    // Every seeded kind should have at least one row in the response.
    for (const kind of kinds) {
      // SYSTEM_BANNER/IMAGE_BANNER/REPORT/EMAIL_PREVIEW share metadata-only
      // rendering, so guard that they are returned by kind even if the UI
      // would render them from metadata.
      expect(returnedKinds.has(kind)).toBe(true);
    }
  });
});

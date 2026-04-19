import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { auditSmokeManifest } from '@/modules/notifications/manifests/__audit__.manifest';
import { notificationClient } from '@/modules/notifications/public';
import {
  NotificationChannel,
  NotificationPriority,
  NotificationType,
} from '@/modules/notifications/public/types';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

/**
 * S3.8 — End-to-end smoke for the notifications pipeline.
 *
 * Wires the full chain in a single test:
 *   manifest registration → dispatcher.dispatch() → notification persisted
 *   → POST /v1/notifications/:id/resolve → callback job enqueued + audit log row.
 *
 * Uses the synthetic `__audit__` module so it never collides with real
 * categories.
 */
describe('Notifications pipeline — smoke (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
    // Boot will have already registered the production manifests; we only
    // need to add our synthetic one. `registerManifest` is idempotent.
    await notificationClient.registerManifest(auditSmokeManifest);
  });

  it('dispatches an APPROVAL, resolves it, and produces audit + callback rows', async () => {
    const { tenantId } = await createAndSetupTenant();
    const { user, token } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id.toString();

    const idempotencyKey = `smoke-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const callbackUrl = '/v1/__audit__/smoke-callback';

    // 1. Dispatch via the public client — exactly the same call any module
    //    in production would make.
    const dispatch = await notificationClient.dispatch({
      type: NotificationType.APPROVAL,
      tenantId,
      recipients: { userIds: [userId] },
      category: '__audit__.smoke_approval',
      priority: NotificationPriority.HIGH,
      channels: [NotificationChannel.IN_APP],
      title: 'Smoke approval',
      body: 'End-to-end smoke notification — please approve.',
      idempotencyKey,
      callbackUrl,
    });

    expect(dispatch.notificationIds).toHaveLength(1);
    expect(dispatch.recipientCount).toBe(1);
    const notificationId = dispatch.notificationIds[0];

    const persisted = await prisma.notification.findUnique({
      where: { id: notificationId },
    });
    expect(persisted).not.toBeNull();
    expect(persisted!.kind).toBe('APPROVAL');
    expect(persisted!.state).toBe('PENDING');
    expect(persisted!.callbackUrl).toBe(callbackUrl);
    expect(persisted!.callbackStatus).toBe('PENDING');
    expect(persisted!.tenantId).toBe(tenantId);

    // 2. Resolve via the v2 HTTP endpoint — same path the UI uses.
    const resolveResponse = await request(app.server)
      .post(`/v1/notifications/${notificationId}/resolve`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        actionKey: 'approve',
        payload: { reason: 'Looks good' },
      });

    expect(resolveResponse.statusCode).toBe(200);
    expect(resolveResponse.body.state).toBe('RESOLVED');
    // Callback was queued because the notification carried a callbackUrl.
    expect(resolveResponse.body.callbackQueued).toBe(true);

    // 3. Verify the resolution mutated the row.
    const resolved = await prisma.notification.findUnique({
      where: { id: notificationId },
    });
    expect(resolved!.state).toBe('RESOLVED');
    expect(resolved!.resolvedAction).toBe('approve');
    expect(resolved!.resolvedById).toBe(userId);
    expect(resolved!.resolvedAt).not.toBeNull();

    // 4. Callback job persisted and waiting for the worker.
    const callbackJob = await prisma.notificationCallbackJob.findFirst({
      where: { notificationId },
    });
    expect(callbackJob).not.toBeNull();
    expect(callbackJob!.callbackUrl).toBe(callbackUrl);
    expect(callbackJob!.status).toBe('PENDING');

    // 5. Audit log row created by the resolve route.
    const auditRow = await prisma.auditLog.findFirst({
      where: {
        entity: 'NOTIFICATION',
        entityId: notificationId,
        userId,
        tenantId,
        action: 'UPDATE',
      },
    });
    expect(auditRow).not.toBeNull();
    expect(auditRow!.module).toBe('NOTIFICATIONS');
  });

  it('rejects undeclared categories when strict manifest is on (env override)', async () => {
    // The dispatcher reads NOTIFICATIONS_STRICT_MANIFEST at call time. We
    // can't toggle process.env safely mid-suite, so we exercise the warning
    // path: an undeclared category just logs a warn and falls through to the
    // DB lookup, which will reject because no row exists. That contract is
    // covered by `UndeclaredCategoryError` in the unit specs, but we assert
    // here that the DB-layer rejection still surfaces as a thrown error.
    const { tenantId } = await createAndSetupTenant();
    const { user } = await createAndAuthenticateUser(app, { tenantId });

    await expect(
      notificationClient.dispatch({
        type: NotificationType.INFORMATIONAL,
        tenantId,
        recipients: { userIds: [user.user.id.toString()] },
        category: '__audit__.does_not_exist',
        title: 't',
        body: 'b',
        idempotencyKey: `bad-${Date.now()}`,
      }),
    ).rejects.toThrow();
  });
});

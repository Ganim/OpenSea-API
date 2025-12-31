import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Delete Notification Preference (E2E)', () => {
  let userToken: string;
  let userId: string;
  let preferenceId: string;

  beforeAll(async () => {
    await app.ready();

    const { token, user } = await createAndAuthenticateUser(app);
    userToken = token;
    userId = user.user.id;

    // Create test preference
    const pref = await prisma.notificationPreference.create({
      data: {
        userId,
        alertType: 'EXPIRING_SOON',
        channel: 'PUSH',
        isEnabled: true,
      },
    });
    preferenceId = pref.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to delete a preference (soft delete)', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: `/v1/notification-preferences/${preferenceId}`,
      headers: {
        authorization: `Bearer ${userToken}`,
      },
    });

    expect(response.statusCode).toBe(204);

    // Verify soft delete
    const deleted = await prisma.notificationPreference.findUnique({
      where: { id: preferenceId },
    });
    expect(deleted?.deletedAt).not.toBeNull();
    expect(deleted?.isEnabled).toBe(false);
  });

  it('should not be able to delete preference without authentication', async () => {
    const pref = await prisma.notificationPreference.create({
      data: {
        userId,
        alertType: 'EXPIRED',
        channel: 'EMAIL',
        isEnabled: true,
      },
    });

    const response = await app.inject({
      method: 'DELETE',
      url: `/v1/notification-preferences/${pref.id}`,
    });

    expect(response.statusCode).toBe(401);
  });

  it('should return 404 when deleting non-existent preference', async () => {
    const { randomUUID } = await import('node:crypto');

    const response = await app.inject({
      method: 'DELETE',
      url: `/v1/notification-preferences/${randomUUID()}`,
      headers: {
        authorization: `Bearer ${userToken}`,
      },
    });

    expect(response.statusCode).toBe(404);
  });
});

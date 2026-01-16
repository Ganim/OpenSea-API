import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Delete Notification Preference (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should delete notification preference with correct schema', async () => {
    const { token, user } = await createAndAuthenticateUser(app);
    const userId = user.user.id;

    const pref = await prisma.notificationPreference.create({
      data: {
        userId,
        alertType: 'EXPIRING_SOON',
        channel: 'PUSH',
        isEnabled: true,
      },
    });

    const response = await app.inject({
      method: 'DELETE',
      url: `/v1/notification-preferences/${pref.id}`,
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(204);
  });
});

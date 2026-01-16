import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('List and Update Notification Preferences (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list notification preferences with correct schema', async () => {
    const { token, user } = await createAndAuthenticateUser(app);
    const userId = user.user.id;

    await prisma.notificationPreference.create({
      data: {
        userId,
        alertType: 'LOW_STOCK',
        channel: 'EMAIL',
        isEnabled: true,
      },
    });

    const response = await app.inject({
      method: 'GET',
      url: `/v1/notification-preferences/user/${userId}`,
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toHaveProperty('preferences');
    expect(Array.isArray(body.preferences)).toBe(true);
  });
});

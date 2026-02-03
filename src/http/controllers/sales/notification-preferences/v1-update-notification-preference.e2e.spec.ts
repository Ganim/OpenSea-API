import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Update Notification Preference (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should update notification preference with correct schema', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    const pref = await prisma.notificationPreference.create({
      data: {
        userId,
        alertType: 'LOW_STOCK',
        channel: 'EMAIL',
        isEnabled: true,
      },
    });

    const response = await app.inject({
      method: 'PUT',
      url: `/v1/notification-preferences/${pref.id}`,
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        isEnabled: false,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toHaveProperty('preference');
    expect(body.preference).toHaveProperty('id', pref.id);
    expect(body.preference).toHaveProperty('isEnabled', false);
  });

  it('should not update notification preference without auth token', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: '/v1/notification-preferences/00000000-0000-0000-0000-000000000000',
      payload: {
        isEnabled: false,
      },
    });

    expect(response.statusCode).toBe(401);
  });
});

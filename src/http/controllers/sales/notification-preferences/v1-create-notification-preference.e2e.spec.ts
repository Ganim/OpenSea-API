import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Create Notification Preference (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create notification preference with correct schema', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    const response = await app.inject({
      method: 'POST',
      url: '/v1/notification-preferences',
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        userId,
        alertType: 'LOW_STOCK',
        channel: 'EMAIL',
        isEnabled: true,
      },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body).toHaveProperty('preference');
    expect(body.preference).toHaveProperty('id');
    expect(body.preference).toHaveProperty('alertType', 'LOW_STOCK');
    expect(body.preference).toHaveProperty('channel', 'EMAIL');
  });
});

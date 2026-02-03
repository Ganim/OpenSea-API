import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('List My Notification Preferences (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list my notification preferences', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });

    // Create notification preferences in the database
    await prisma.notificationPreference.create({
      data: {
        userId: user.user.id,
        alertType: 'LOW_STOCK',
        channel: 'EMAIL',
        isEnabled: true,
      },
    });

    await prisma.notificationPreference.create({
      data: {
        userId: user.user.id,
        alertType: 'OUT_OF_STOCK',
        channel: 'PUSH',
        isEnabled: false,
      },
    });

    const response = await request(app.server)
      .get('/v1/me/notification-preferences')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('preferences');
    expect(Array.isArray(response.body.preferences)).toBe(true);
    expect(response.body.preferences.length).toBeGreaterThanOrEqual(2);
  });

  it('should return 401 without authentication', async () => {
    const response = await request(app.server).get(
      '/v1/me/notification-preferences',
    );

    expect(response.status).toBe(401);
  });
});

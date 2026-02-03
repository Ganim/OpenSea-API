import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Delete My Notification Preference (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should delete my notification preference', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });

    // Create a notification preference directly in the database
    const preference = await prisma.notificationPreference.create({
      data: {
        userId: user.user.id,
        alertType: 'LOW_STOCK',
        channel: 'EMAIL',
        isEnabled: true,
      },
    });

    const response = await request(app.server)
      .delete(`/v1/me/notification-preferences/${preference.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });

  it('should return 404 for non-existent preference', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .delete(
        '/v1/me/notification-preferences/00000000-0000-0000-0000-000000000000',
      )
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it('should return 401 without authentication', async () => {
    const response = await request(app.server).delete(
      '/v1/me/notification-preferences/00000000-0000-0000-0000-000000000000',
    );

    expect(response.status).toBe(401);
  });
});

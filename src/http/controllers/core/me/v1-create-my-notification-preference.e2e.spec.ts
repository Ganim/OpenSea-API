import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Create My Notification Preference (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a notification preference', async () => {
    const { token, user } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .post('/v1/me/notification-preferences')
      .set('Authorization', `Bearer ${token}`)
      .send({
        userId: user.user.id,
        alertType: 'LOW_STOCK',
        channel: 'EMAIL',
        isEnabled: true,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('preference');
    expect(response.body.preference).toHaveProperty('id');
    expect(response.body.preference.alertType).toBe('LOW_STOCK');
    expect(response.body.preference.channel).toBe('EMAIL');
    expect(response.body.preference.isEnabled).toBe(true);
  });

  it('should return 401 without authentication', async () => {
    const response = await request(app.server)
      .post('/v1/me/notification-preferences')
      .send({
        userId: '00000000-0000-0000-0000-000000000000',
        alertType: 'LOW_STOCK',
        channel: 'EMAIL',
      });

    expect(response.status).toBe(401);
  });
});

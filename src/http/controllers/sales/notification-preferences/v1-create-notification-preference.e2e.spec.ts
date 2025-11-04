import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Create Notification Preference (E2E)', () => {
  let userToken: string;
  let userId: string;

  beforeAll(async () => {
    await app.ready();

    const { token, user } = await createAndAuthenticateUser(app, 'MANAGER');
    userToken = token;
    userId = user.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to create a notification preference', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/notification-preferences',
      headers: {
        authorization: `Bearer ${userToken}`,
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
    expect(body.preference).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        userId,
        alertType: 'LOW_STOCK',
        channel: 'EMAIL',
        isEnabled: true,
      }),
    );
  });

  it('should not be able to create a preference without authentication', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/notification-preferences',
      payload: {
        userId,
        alertType: 'LOW_STOCK',
        channel: 'EMAIL',
      },
    });

    expect(response.statusCode).toBe(401);
  });

  it('should not be able to create a preference with invalid alert type', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/notification-preferences',
      headers: {
        authorization: `Bearer ${userToken}`,
      },
      payload: {
        userId,
        alertType: 'INVALID_TYPE',
        channel: 'EMAIL',
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('should not be able to create a preference with invalid channel', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/notification-preferences',
      headers: {
        authorization: `Bearer ${userToken}`,
      },
      payload: {
        userId,
        alertType: 'LOW_STOCK',
        channel: 'INVALID_CHANNEL',
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('should create preference with isEnabled = true by default', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/notification-preferences',
      headers: {
        authorization: `Bearer ${userToken}`,
      },
      payload: {
        userId,
        alertType: 'OUT_OF_STOCK',
        channel: 'SMS',
      },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.preference.isEnabled).toBe(true);
  });
});

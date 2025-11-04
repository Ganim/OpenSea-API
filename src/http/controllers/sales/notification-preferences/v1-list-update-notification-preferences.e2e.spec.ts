import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('List and Update Notification Preferences (E2E)', () => {
  let userToken: string;
  let userId: string;
  let preferenceId1: string;
  let preferenceId2: string;

  beforeAll(async () => {
    await app.ready();

    const { token, user } = await createAndAuthenticateUser(app, 'MANAGER');
    userToken = token;
    userId = user.user.id;

    // Create test preferences
    const pref1 = await prisma.notificationPreference.create({
      data: {
        userId,
        alertType: 'LOW_STOCK',
        channel: 'EMAIL',
        isEnabled: true,
      },
    });
    preferenceId1 = pref1.id;

    const pref2 = await prisma.notificationPreference.create({
      data: {
        userId,
        alertType: 'OUT_OF_STOCK',
        channel: 'SMS',
        isEnabled: false,
      },
    });
    preferenceId2 = pref2.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to list all user preferences', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/v1/notification-preferences/user/${userId}`,
      headers: {
        authorization: `Bearer ${userToken}`,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.preferences).toHaveLength(2);
  });

  it('should be able to list only enabled preferences', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/v1/notification-preferences/user/${userId}?enabledOnly=true`,
      headers: {
        authorization: `Bearer ${userToken}`,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.preferences).toHaveLength(1);
    expect(body.preferences[0].isEnabled).toBe(true);
  });

  it('should not be able to list preferences without authentication', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/v1/notification-preferences/user/${userId}`,
    });

    expect(response.statusCode).toBe(401);
  });

  it('should be able to update a preference', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: `/v1/notification-preferences/${preferenceId2}`,
      headers: {
        authorization: `Bearer ${userToken}`,
      },
      payload: {
        isEnabled: true,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.preference.isEnabled).toBe(true);
    expect(body.preference.id).toBe(preferenceId2);
  });

  it('should return 404 when updating non-existent preference', async () => {
    const { randomUUID } = await import('node:crypto');

    const response = await app.inject({
      method: 'PUT',
      url: `/v1/notification-preferences/${randomUUID()}`,
      headers: {
        authorization: `Bearer ${userToken}`,
      },
      payload: {
        isEnabled: false,
      },
    });

    expect(response.statusCode).toBe(404);
  });

  it('should not be able to update preference without authentication', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: `/v1/notification-preferences/${preferenceId1}`,
      payload: {
        isEnabled: false,
      },
    });

    expect(response.statusCode).toBe(401);
  });
});

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { makeNotification } from '@/utils/tests/factories/notifications/make-notification';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Mark All Notifications As Read (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should mark all notifications as read for user', async () => {
    const { token, user } = await createAndAuthenticateUser(app);
    const userId = user.user.id.toString();

    await makeNotification({ userId, type: 'INFO', channel: 'IN_APP' });
    await makeNotification({ userId, type: 'ERROR', channel: 'EMAIL' });

    const response = await request(app.server)
      .post('/v1/notifications/mark-all-read')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({ count: expect.any(Number) });

    const listResponse = await request(app.server)
      .get('/v1/notifications?isRead=true')
      .set('Authorization', `Bearer ${token}`);

    expect(listResponse.statusCode).toEqual(200);
    expect(listResponse.body.notifications.length).toBeGreaterThanOrEqual(2);
  });
});

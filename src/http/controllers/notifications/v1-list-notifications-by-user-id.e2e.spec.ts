import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { makeNotification } from '@/utils/tests/factories/notifications/make-notification';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('List Notifications By UserId (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list notifications of the authenticated user', async () => {
    const { token, user } = await createAndAuthenticateUser(app, 'USER');
    const userId = user.user.id.toString();

    await makeNotification({ userId, type: 'INFO', channel: 'IN_APP' });
    await makeNotification({ userId, type: 'ERROR', channel: 'EMAIL' });

    const response = await request(app.server)
      .get('/v1/notifications')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      notifications: expect.arrayContaining([
        expect.objectContaining({ userId }),
      ]),
      total: expect.any(Number),
      totalPages: expect.any(Number),
    });
  });

  it('should filter by read status', async () => {
    const { token, user } = await createAndAuthenticateUser(app, 'USER');
    const userId = user.user.id.toString();

    const n = await makeNotification({
      userId,
      type: 'INFO',
      channel: 'IN_APP',
    });

    // mark as read via endpoint
    await request(app.server)
      .patch(`/v1/notifications/${n.id.toString()}/read`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    const response = await request(app.server)
      .get('/v1/notifications?isRead=true')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body.notifications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: n.id.toString(), isRead: true }),
      ]),
    );
  });
});

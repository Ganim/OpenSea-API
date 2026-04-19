import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { makeNotification } from '@/utils/tests/factories/notifications/make-notification';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Mark Notification As Read (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  it('should mark a notification as read', async () => {
    const { token, user } = await createAndAuthenticateUser(app);
    const userId = user.user.id.toString();
    const n = await makeNotification({
      userId,
      type: 'INFO',
      channel: 'IN_APP',
    });

    const response = await request(app.server)
      .patch(`/v1/notifications/${n.id.toString()}/read`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(204);

    const listResponse = await request(app.server)
      .get('/v1/notifications?isRead=true')
      .set('Authorization', `Bearer ${token}`);

    expect(listResponse.statusCode).toEqual(200);
    expect(listResponse.body.notifications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: n.id.toString(), isRead: true }),
      ]),
    );
  });

  it('should reject marking a notification that belongs to another user', async () => {
    const { user: ownerUser } = await createAndAuthenticateUser(app);
    const { token: attackerToken } = await createAndAuthenticateUser(app);

    const ownerId = ownerUser.user.id.toString();
    const n = await makeNotification({
      userId: ownerId,
      type: 'INFO',
      channel: 'IN_APP',
    });

    const response = await request(app.server)
      .patch(`/v1/notifications/${n.id.toString()}/read`)
      .set('Authorization', `Bearer ${attackerToken}`)
      .send();

    expect(response.statusCode).toEqual(404);
  });
});

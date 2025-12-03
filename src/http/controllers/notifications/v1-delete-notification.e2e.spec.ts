import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { makeNotification } from '@/utils/tests/factories/notifications/make-notification';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Delete Notification (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should soft delete a notification', async () => {
    const { token, user } = await createAndAuthenticateUser(app, 'USER');
    const userId = user.user.id.toString();
    const n = await makeNotification({
      userId,
      type: 'INFO',
      channel: 'IN_APP',
    });

    const response = await request(app.server)
      .delete(`/v1/notifications/${n.id.toString()}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(204);

    const listResponse = await request(app.server)
      .get('/v1/notifications')
      .set('Authorization', `Bearer ${token}`);

    // deleted notification should not be listed
    expect(listResponse.body.notifications).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: n.id.toString() }),
      ]),
    );
  });
});

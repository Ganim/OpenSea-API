import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { makeUniqueEmail } from '@/utils/tests/factories/core/make-unique-email';
import { makeUniqueUsername } from '@/utils/tests/factories/core/make-unique-username';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('List Online Users (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });
  afterAll(async () => {
    await app.close();
  });

  it('should allow USERS to LIST ONLINE users ', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');

    const email = makeUniqueEmail('online-user');
    await request(app.server)
      .post('/v1/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email,
        username: makeUniqueUsername(),
        password: 'Pass@123',
      });

    const response = await request(app.server)
      .get('/v1/users/online')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toEqual(200);
  });
});

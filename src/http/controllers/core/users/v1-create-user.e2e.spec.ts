import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { makeUniqueEmail } from '@/utils/tests/factories/core/make-unique-email';
import { makeUniqueUsername } from '@/utils/tests/factories/core/make-unique-username';

describe('Create User (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create user with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const email = makeUniqueEmail('newuser');
    const username = makeUniqueUsername();

    const response = await request(app.server)
      .post('/v1/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email,
        username,
        password: 'Pass@123',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('user');
    expect(response.body.user).toHaveProperty('id');
    expect(response.body.user).toHaveProperty('email');
  });
});

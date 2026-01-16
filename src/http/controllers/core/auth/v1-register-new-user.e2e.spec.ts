import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { makeUniqueEmail } from '@/utils/tests/factories/core/make-unique-email';

describe('Register New User (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should register new user with correct schema', async () => {
    const email = makeUniqueEmail('register');

    const response = await request(app.server)
      .post('/v1/auth/register/password')
      .send({
        email,
        password: 'Pass@123',
      });

    expect(response.status).toBe(201);
  });
});

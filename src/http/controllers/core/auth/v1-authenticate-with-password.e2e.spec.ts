import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { makeUniqueEmail } from '@/utils/tests/factories/core/make-unique-email';

describe('Authenticate with Password (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should authenticate with password with correct schema', async () => {
    const email = makeUniqueEmail('auth-login');

    await request(app.server).post('/v1/auth/register/password').send({
      email,
      password: 'Pass@123',
    });

    const response = await request(app.server)
      .post('/v1/auth/login/password')
      .send({
        email,
        password: 'Pass@123',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('user');
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('refreshToken');
    expect(response.body).toHaveProperty('sessionId');
  });
});

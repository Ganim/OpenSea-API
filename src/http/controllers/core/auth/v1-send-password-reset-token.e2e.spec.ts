import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { makeUniqueEmail } from '@/utils/tests/factories/core/make-unique-email';

describe('Send Password Reset Token (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should send password reset token with correct schema', async () => {
    const email = makeUniqueEmail('send-reset');

    await request(app.server).post('/v1/auth/register/password').send({
      email,
      password: 'Pass@123',
    });

    const response = await request(app.server)
      .post('/v1/auth/send/password')
      .send({ email });

    expect(response.status).toBe(200);
  }, 15000);
});

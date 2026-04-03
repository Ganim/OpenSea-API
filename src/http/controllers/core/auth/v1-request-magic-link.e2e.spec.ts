import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { makeUniqueEmail } from '@/utils/tests/factories/core/make-unique-email';

describe('Request Magic Link (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });


  it('should request magic link for valid identifier', async () => {
    const email = makeUniqueEmail('req-magic');

    // Register user first
    await request(app.server).post('/v1/auth/register/password').send({
      email,
      password: 'Pass@123',
    });

    const response = await request(app.server)
      .post('/v1/auth/magic-link/request')
      .send({ identifier: email });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message');
  });

  it('should return 200 even for non-existent identifier (no user enumeration)', async () => {
    const response = await request(app.server)
      .post('/v1/auth/magic-link/request')
      .send({ identifier: 'nonexistent-magic@example.com' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message');
  });
});

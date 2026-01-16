import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { makeUniqueEmail } from '@/utils/tests/factories/core/make-unique-email';

describe('Change My Email (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should change my email with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const newEmail = makeUniqueEmail('change-my-email');

    const response = await request(app.server)
      .patch('/v1/me/email')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: newEmail });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('user');
    expect(response.body.user).toHaveProperty('email');
  });
});

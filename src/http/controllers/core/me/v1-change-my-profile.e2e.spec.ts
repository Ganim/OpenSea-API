import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Change My Profile (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should change my profile with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .patch('/v1/me')
      .set('Authorization', `Bearer ${token}`)
      .send({
        profile: {
          name: 'NovoNome',
          surname: 'NovoSobrenome',
          location: 'Portugal',
          bio: 'Bio editada',
          avatarUrl: 'https://example.com/avatar.png',
        },
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('user');
    expect(response.body.user).toHaveProperty('profile');
  });
});

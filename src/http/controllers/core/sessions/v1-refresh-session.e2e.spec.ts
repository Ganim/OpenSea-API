import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Refresh Session (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should refresh session with correct schema', async () => {
    const { refreshToken } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .patch('/v1/sessions/refresh')
      .set('Authorization', `Bearer ${refreshToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('refreshToken');
  });

  it('should return 401 when refresh token is missing', async () => {
    const response = await request(app.server).patch('/v1/sessions/refresh');

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('message');
  });

  it('should return 401 when refresh token is invalid', async () => {
    const response = await request(app.server)
      .patch('/v1/sessions/refresh')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('message');
  });
});

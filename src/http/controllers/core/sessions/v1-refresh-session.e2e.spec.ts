import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Refresh Session (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });
  afterAll(async () => {
    await app.close();
  });

  it('should allow USER to REFRESH his SESSION', async () => {
    const { refreshToken } = await createAndAuthenticateUser(app, 'USER');

    const res = await request(app.server)
      .patch('/v1/sessions/refresh')
      .set('Authorization', `Bearer ${refreshToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.token).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
    expect(res.body.token).not.toBe(refreshToken);
    expect(res.body.refreshToken).not.toBe(refreshToken);
  });
});

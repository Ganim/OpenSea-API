import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Authenticate with Access PIN (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should authenticate with correct access PIN', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    // First, set an access PIN
    await request(app.server)
      .patch('/v1/me/access-pin')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'Pass@123',
        newAccessPin: '654321',
      });

    // Then authenticate with the access PIN
    const response = await request(app.server)
      .post('/v1/auth/login/pin')
      .send({
        userId,
        accessPin: '654321',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('user');
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('refreshToken');
    expect(response.body).toHaveProperty('sessionId');
  });

  it('should return 400 with wrong access PIN', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    // Set an access PIN
    await request(app.server)
      .patch('/v1/me/access-pin')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'Pass@123',
        newAccessPin: '654321',
      });

    // Try to authenticate with wrong PIN
    const response = await request(app.server)
      .post('/v1/auth/login/pin')
      .send({
        userId,
        accessPin: '000000',
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
  });

  it('should return error for non-existent user', async () => {
    const response = await request(app.server)
      .post('/v1/auth/login/pin')
      .send({
        userId: '00000000-0000-0000-0000-000000000000',
        accessPin: '123456',
      });

    expect([400, 404]).toContain(response.status);
    expect(response.body).toHaveProperty('message');
  });
});

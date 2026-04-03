import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Serve Token (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should create a short-lived serve token', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/storage/files/serve-token')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(typeof response.body.token).toBe('string');
    expect(response.body.token.length).toBeGreaterThan(0);
    expect(response.body).toHaveProperty('expiresIn');
    expect(response.body.expiresIn).toBe(300);
  });

  it('should return a valid JWT token', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/storage/files/serve-token')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);

    // Token should be a valid JWT (3 dot-separated base64 segments)
    const parts = response.body.token.split('.');
    expect(parts).toHaveLength(3);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).post(
      '/v1/storage/files/serve-token',
    );

    expect(response.status).toBe(401);
  });
});

import { app } from '@/app';
import { createAndAuthenticateSuperAdmin } from '@/utils/tests/factories/core/create-and-authenticate-super-admin.e2e';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Admin Get System Health (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return system health status', async () => {
    const { token } = await createAndAuthenticateSuperAdmin(app);

    const response = await request(app.server)
      .get('/v1/admin/monitoring/health')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.health).toHaveProperty('status');
    expect(response.body.health).toHaveProperty('uptime');
    expect(response.body.health).toHaveProperty('services');
    expect(response.body.health.services).toHaveProperty('api');
    expect(response.body.health.services).toHaveProperty('database');
    expect(response.body.health.services).toHaveProperty('redis');
  });

  it('should return 403 for non-super-admin user', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .get('/v1/admin/monitoring/health')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
  });
});

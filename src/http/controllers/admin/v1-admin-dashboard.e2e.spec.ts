import { app } from '@/app';
import { createAndAuthenticateSuperAdmin } from '@/utils/tests/factories/core/create-and-authenticate-super-admin.e2e';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Admin Dashboard (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return system statistics', async () => {
    const { token } = await createAndAuthenticateSuperAdmin(app);

    const response = await request(app.server)
      .get('/v1/admin/dashboard')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('totalTenants');
    expect(response.body).toHaveProperty('totalPlans');
    expect(response.body).toHaveProperty('activePlans');
    expect(typeof response.body.totalTenants).toBe('number');
    expect(typeof response.body.totalPlans).toBe('number');
    expect(typeof response.body.activePlans).toBe('number');
  });

  it('should return 403 for non-super-admin user', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .get('/v1/admin/dashboard')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
  });
});

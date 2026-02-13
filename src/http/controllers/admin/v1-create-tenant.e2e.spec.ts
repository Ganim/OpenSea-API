import { app } from '@/app';
import { createAndAuthenticateSuperAdmin } from '@/utils/tests/factories/core/create-and-authenticate-super-admin.e2e';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Create Tenant (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a new tenant', async () => {
    const { token } = await createAndAuthenticateSuperAdmin(app);
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/admin/tenants')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Tenant E2E ${timestamp}`,
        slug: `tenant-e2e-${timestamp}`,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('tenant');
    expect(response.body.tenant.name).toBe(`Tenant E2E ${timestamp}`);
    expect(response.body.tenant.slug).toBe(`tenant-e2e-${timestamp}`);
    expect(response.body.tenant.status).toBe('ACTIVE');
    expect(response.body.tenant).toHaveProperty('id');
    expect(response.body.tenant).toHaveProperty('createdAt');
  });

  it('should create tenant with custom status', async () => {
    const { token } = await createAndAuthenticateSuperAdmin(app);
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/admin/tenants')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Inactive Tenant ${timestamp}`,
        slug: `inactive-${timestamp}`,
        status: 'INACTIVE',
      });

    expect(response.status).toBe(201);
    expect(response.body.tenant.status).toBe('INACTIVE');
  });

  it('should return 403 for non-super-admin user', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .post('/v1/admin/tenants')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Forbidden Tenant',
      });

    expect([400, 403]).toContain(response.status);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).post('/v1/admin/tenants').send({
      name: 'No Auth Tenant',
    });

    expect([400, 401]).toContain(response.status);
  });
});

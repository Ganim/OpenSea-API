import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateSuperAdmin } from '@/utils/tests/factories/core/create-and-authenticate-super-admin.e2e';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Create Tenant User (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a user and assign to tenant', async () => {
    const { token } = await createAndAuthenticateSuperAdmin(app);
    const timestamp = Date.now();

    const tenant = await prisma.tenant.create({
      data: {
        name: `User Create Tenant ${timestamp}`,
        slug: `user-create-${timestamp}`,
        status: 'ACTIVE',
      },
    });

    const response = await request(app.server)
      .post(`/v1/admin/tenants/${tenant.id}/users`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: `tenantuser${timestamp}@test.com`,
        password: 'Pass@123',
        username: `tuser${timestamp.toString().slice(-8)}`,
        role: 'member',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('user');
    expect(response.body).toHaveProperty('tenantUser');
    expect(response.body.user.email).toBe(`tenantuser${timestamp}@test.com`);
    expect(response.body.tenantUser.tenantId).toBe(tenant.id);
    expect(response.body.tenantUser.role).toBe('member');
  });

  it('should return 404 for non-existent tenant', async () => {
    const { token } = await createAndAuthenticateSuperAdmin(app);
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/admin/tenants/00000000-0000-0000-0000-000000000000/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: `notfound${timestamp}@test.com`,
        password: 'Pass@123',
      });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
  });

  it('should return 403 for non-super-admin user', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .post('/v1/admin/tenants/00000000-0000-0000-0000-000000000000/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 'forbidden@test.com',
        password: 'Pass@123',
      });

    expect([400, 403]).toContain(response.status);
  });
});

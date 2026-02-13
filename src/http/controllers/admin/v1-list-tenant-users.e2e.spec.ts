import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateSuperAdmin } from '@/utils/tests/factories/core/create-and-authenticate-super-admin.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('List Tenant Users (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list users of a tenant', async () => {
    const { token, user } = await createAndAuthenticateSuperAdmin(app);

    // Create a tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: `Test Tenant ${Date.now()}`,
        slug: `test-tenant-${Date.now()}`,
        status: 'ACTIVE',
      },
    });

    // Add the authenticated user as a tenant user
    await prisma.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: user.user.id,
        role: 'owner',
        joinedAt: new Date(),
      },
    });

    const response = await request(app.server)
      .get(`/v1/admin/tenants/${tenant.id}/users`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('users');
    expect(Array.isArray(response.body.users)).toBe(true);
    expect(response.body.users.length).toBeGreaterThanOrEqual(1);
    expect(response.body.users[0]).toHaveProperty('id');
    expect(response.body.users[0]).toHaveProperty('tenantId');
    expect(response.body.users[0]).toHaveProperty('userId');
    expect(response.body.users[0]).toHaveProperty('role');
  });

  it('should return 404 for non-existent tenant', async () => {
    const { token } = await createAndAuthenticateSuperAdmin(app);

    const response = await request(app.server)
      .get('/v1/admin/tenants/00000000-0000-0000-0000-000000000000/users')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });
});

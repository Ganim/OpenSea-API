import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('List User Tenants (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list tenants for the authenticated user', async () => {
    const { token, user } = await createAndAuthenticateUser(app);

    // Create a tenant and associate the user
    const tenant = await prisma.tenant.create({
      data: {
        name: `User Tenant ${Date.now()}`,
        slug: `user-tenant-${Date.now()}`,
        status: 'ACTIVE',
      },
    });

    await prisma.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: user.user.id,
        role: 'owner',
        joinedAt: new Date(),
      },
    });

    const response = await request(app.server)
      .get('/v1/auth/tenants')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('tenants');
    expect(Array.isArray(response.body.tenants)).toBe(true);
    expect(response.body.tenants.length).toBeGreaterThanOrEqual(1);
    expect(response.body.tenants[0]).toHaveProperty('id');
    expect(response.body.tenants[0]).toHaveProperty('name');
    expect(response.body.tenants[0]).toHaveProperty('slug');
    expect(response.body.tenants[0]).toHaveProperty('role');
  });

  it('should return 401 without authentication', async () => {
    const response = await request(app.server).get('/v1/auth/tenants');

    expect(response.status).toBe(401);
  });
});

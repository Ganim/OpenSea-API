import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Get Tenant (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get tenant details by id', async () => {
    const { token, user } = await createAndAuthenticateUser(app);

    // Create a tenant and associate the user
    const tenant = await prisma.tenant.create({
      data: {
        name: `Get Tenant ${Date.now()}`,
        slug: `get-tenant-${Date.now()}`,
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

    // Select the tenant to get a scoped token
    const selectResponse = await request(app.server)
      .post('/v1/auth/select-tenant')
      .set('Authorization', `Bearer ${token}`)
      .send({ tenantId: tenant.id });

    const tenantScopedToken = selectResponse.body.token;

    const response = await request(app.server)
      .get(`/v1/tenants/${tenant.id}`)
      .set('Authorization', `Bearer ${tenantScopedToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('tenant');
    expect(response.body.tenant.id).toBe(tenant.id);
    expect(response.body.tenant).toHaveProperty('name');
    expect(response.body.tenant).toHaveProperty('slug');
    expect(response.body.tenant).toHaveProperty('status');
  });

  it('should return 403 without tenant context', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .get('/v1/tenants/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
  });

  it('should return 401 without authentication', async () => {
    const response = await request(app.server).get(
      '/v1/tenants/00000000-0000-0000-0000-000000000000',
    );

    expect(response.status).toBe(401);
  });
});

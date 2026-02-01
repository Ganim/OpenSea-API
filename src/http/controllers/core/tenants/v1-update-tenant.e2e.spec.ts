import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Update Tenant (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should update tenant information', async () => {
    const { token, user } = await createAndAuthenticateUser(app);

    // Create a tenant and associate the user
    const tenant = await prisma.tenant.create({
      data: {
        name: `Update Tenant ${Date.now()}`,
        slug: `update-tenant-${Date.now()}`,
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

    const updatedName = `Updated Tenant ${Date.now()}`;

    const response = await request(app.server)
      .put(`/v1/tenants/${tenant.id}`)
      .set('Authorization', `Bearer ${tenantScopedToken}`)
      .send({
        name: updatedName,
        settings: { theme: 'dark' },
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('tenant');
    expect(response.body.tenant.name).toBe(updatedName);
  });

  it('should return 403 without tenant context', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .put('/v1/tenants/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Should Fail' });

    expect(response.status).toBe(403);
  });

  it('should return 401 without authentication', async () => {
    const response = await request(app.server)
      .put('/v1/tenants/00000000-0000-0000-0000-000000000000')
      .send({ name: 'Should Fail' });

    expect(response.status).toBe(401);
  });
});

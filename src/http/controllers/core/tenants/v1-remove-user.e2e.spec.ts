import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Remove User from Tenant (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should remove a user from the tenant', { timeout: 20000 }, async () => {
    const { token, user } = await createAndAuthenticateUser(app);

    // Create a second user to remove
    const { user: memberUser } = await createAndAuthenticateUser(app);

    // Create a tenant and associate the owner
    const tenant = await prisma.tenant.create({
      data: {
        name: `Remove User Tenant ${Date.now()}`,
        slug: `remove-user-${Date.now()}`,
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

    // Add the member to the tenant
    await prisma.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: memberUser.user.id,
        role: 'member',
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
      .delete(`/v1/tenants/${tenant.id}/users/${memberUser.user.id}`)
      .set('Authorization', `Bearer ${tenantScopedToken}`);

    expect(response.status).toBe(204);
  });

  it('should not allow access without tenant context', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .delete(
        '/v1/tenants/00000000-0000-0000-0000-000000000000/users/00000000-0000-0000-0000-000000000001',
      )
      .set('Authorization', `Bearer ${token}`);

    // Zod validation or tenant middleware prevents access
    expect([400, 403]).toContain(response.status);
  });

  it('should not allow access without authentication', async () => {
    const response = await request(app.server).delete(
      '/v1/tenants/00000000-0000-0000-0000-000000000000/users/00000000-0000-0000-0000-000000000001',
    );

    // Zod validation or auth middleware prevents access
    expect([400, 401]).toContain(response.status);
  });
});

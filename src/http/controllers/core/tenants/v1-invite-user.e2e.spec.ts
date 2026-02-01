import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Invite User to Tenant (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should invite a user to the tenant', { timeout: 20000 }, async () => {
    const { token, user } = await createAndAuthenticateUser(app);

    // Create a second user to invite
    const { user: invitedUser } = await createAndAuthenticateUser(app);

    // Create a tenant and associate the owner
    const tenant = await prisma.tenant.create({
      data: {
        name: `Invite Tenant ${Date.now()}`,
        slug: `invite-tenant-${Date.now()}`,
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
      .post(`/v1/tenants/${tenant.id}/users`)
      .set('Authorization', `Bearer ${tenantScopedToken}`)
      .send({
        userId: invitedUser.user.id,
        role: 'MEMBER',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('tenantUser');
    expect(response.body.tenantUser).toHaveProperty('id');
    expect(response.body.tenantUser.tenantId).toBe(tenant.id);
    expect(response.body.tenantUser.userId).toBe(invitedUser.user.id);
  });

  it('should not allow access without tenant context', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .post('/v1/tenants/00000000-0000-0000-0000-000000000000/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        userId: '00000000-0000-0000-0000-000000000001',
        role: 'MEMBER',
      });

    // Zod validation or tenant middleware prevents access
    expect([400, 403]).toContain(response.status);
  });

  it('should not allow access without authentication', async () => {
    const response = await request(app.server)
      .post('/v1/tenants/00000000-0000-0000-0000-000000000000/users')
      .send({
        userId: '00000000-0000-0000-0000-000000000001',
        role: 'MEMBER',
      });

    // Zod validation or auth middleware prevents access
    expect([400, 401]).toContain(response.status);
  });
});

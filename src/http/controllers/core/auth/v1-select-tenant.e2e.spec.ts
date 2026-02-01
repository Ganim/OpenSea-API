import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Select Tenant (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should select a tenant and return a scoped token', async () => {
    const { token, user } = await createAndAuthenticateUser(app);

    // Create a tenant and associate the user
    const tenant = await prisma.tenant.create({
      data: {
        name: `Select Tenant ${Date.now()}`,
        slug: `select-tenant-${Date.now()}`,
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
      .post('/v1/auth/select-tenant')
      .set('Authorization', `Bearer ${token}`)
      .send({ tenantId: tenant.id });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('tenant');
    expect(response.body.tenant.id).toBe(tenant.id);
    expect(response.body.tenant.name).toContain('Select Tenant');
    expect(typeof response.body.token).toBe('string');
  });

  it('should return 404 for non-existent tenant', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .post('/v1/auth/select-tenant')
      .set('Authorization', `Bearer ${token}`)
      .send({ tenantId: '00000000-0000-0000-0000-000000000000' });

    expect(response.status).toBe(404);
  });

  it('should return 401 without authentication', async () => {
    const response = await request(app.server)
      .post('/v1/auth/select-tenant')
      .send({ tenantId: '00000000-0000-0000-0000-000000000000' });

    expect(response.status).toBe(401);
  });
});

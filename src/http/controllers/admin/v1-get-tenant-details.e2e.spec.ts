import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateSuperAdmin } from '@/utils/tests/factories/core/create-and-authenticate-super-admin.e2e';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Get Tenant Details (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get tenant details', async () => {
    const { token } = await createAndAuthenticateSuperAdmin(app);

    const tenant = await prisma.tenant.create({
      data: {
        name: `Detail Tenant ${Date.now()}`,
        slug: `detail-tenant-${Date.now()}`,
        status: 'ACTIVE',
      },
    });

    const response = await request(app.server)
      .get(`/v1/admin/tenants/${tenant.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('tenant');
    expect(response.body.tenant.id).toBe(tenant.id);
    expect(response.body.tenant.name).toContain('Detail Tenant');
    expect(response.body.tenant).toHaveProperty('slug');
    expect(response.body.tenant).toHaveProperty('status');
  });

  it('should return 404 for non-existent tenant', async () => {
    const { token } = await createAndAuthenticateSuperAdmin(app);

    const response = await request(app.server)
      .get('/v1/admin/tenants/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it('should return 403 for non-super-admin user', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .get('/v1/admin/tenants/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
  });
});

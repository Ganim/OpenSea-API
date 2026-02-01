import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateSuperAdmin } from '@/utils/tests/factories/core/create-and-authenticate-super-admin.e2e';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Manage Feature Flags (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should enable a feature flag for a tenant', async () => {
    const { token } = await createAndAuthenticateSuperAdmin(app);

    const tenant = await prisma.tenant.create({
      data: {
        name: `Feature Flag Tenant ${Date.now()}`,
        slug: `ff-tenant-${Date.now()}`,
        status: 'ACTIVE',
      },
    });

    const response = await request(app.server)
      .put(`/v1/admin/tenants/${tenant.id}/feature-flags`)
      .set('Authorization', `Bearer ${token}`)
      .send({ flag: 'ADVANCED_REPORTS', enabled: true });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('featureFlag');
    expect(response.body.featureFlag.tenantId).toBe(tenant.id);
    expect(response.body.featureFlag.flag).toBe('ADVANCED_REPORTS');
    expect(response.body.featureFlag.enabled).toBe(true);
  });

  it('should disable a feature flag for a tenant', async () => {
    const { token } = await createAndAuthenticateSuperAdmin(app);

    const tenant = await prisma.tenant.create({
      data: {
        name: `FF Disable Tenant ${Date.now()}`,
        slug: `ff-disable-${Date.now()}`,
        status: 'ACTIVE',
      },
    });

    // First enable
    await request(app.server)
      .put(`/v1/admin/tenants/${tenant.id}/feature-flags`)
      .set('Authorization', `Bearer ${token}`)
      .send({ flag: 'BETA_FEATURE', enabled: true });

    // Then disable
    const response = await request(app.server)
      .put(`/v1/admin/tenants/${tenant.id}/feature-flags`)
      .set('Authorization', `Bearer ${token}`)
      .send({ flag: 'BETA_FEATURE', enabled: false });

    expect(response.status).toBe(200);
    expect(response.body.featureFlag.enabled).toBe(false);
  });

  it('should return 404 for non-existent tenant', async () => {
    const { token } = await createAndAuthenticateSuperAdmin(app);

    const response = await request(app.server)
      .put(
        '/v1/admin/tenants/00000000-0000-0000-0000-000000000000/feature-flags',
      )
      .set('Authorization', `Bearer ${token}`)
      .send({ flag: 'SOME_FLAG', enabled: true });

    expect(response.status).toBe(404);
  });

  it('should return 403 for non-super-admin user', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .put(
        '/v1/admin/tenants/00000000-0000-0000-0000-000000000000/feature-flags',
      )
      .set('Authorization', `Bearer ${token}`)
      .send({ flag: 'SOME_FLAG', enabled: true });

    expect(response.status).toBe(403);
  });
});

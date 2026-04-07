import { app } from '@/app';
import { createAndAuthenticateSuperAdmin } from '@/utils/tests/factories/core/create-and-authenticate-super-admin.e2e';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Admin List Tenant Feature Flags (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should list feature flags for a tenant', async () => {
    const { token } = await createAndAuthenticateSuperAdmin(app);

    const response = await request(app.server)
      .get(`/v1/admin/tenants/${tenantId}/feature-flags`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('featureFlags');
    expect(response.body).toHaveProperty('systemFlags');
    expect(Array.isArray(response.body.featureFlags)).toBe(true);
    expect(Array.isArray(response.body.systemFlags)).toBe(true);
  });

  it('should return 403 for non-super-admin user', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .get(`/v1/admin/tenants/${tenantId}/feature-flags`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
  });
});

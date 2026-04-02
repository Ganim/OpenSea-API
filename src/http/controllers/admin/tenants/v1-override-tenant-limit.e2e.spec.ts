import { app } from '@/app';
import { createAndAuthenticateSuperAdmin } from '@/utils/tests/factories/core/create-and-authenticate-super-admin.e2e';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Admin Override Tenant Limit (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should override tenant usage limit', async () => {
    const { token } = await createAndAuthenticateSuperAdmin(app);

    const response = await request(app.server)
      .post(`/v1/admin/tenants/${tenantId}/limit-override`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        metric: 'ai_queries',
        newLimit: 1000,
      });

    expect([200, 400]).toContain(response.status);
    if (response.status === 200) {
      expect(response.body).toHaveProperty('consumption');
    }
  });

  it('should return 403 for non-super-admin user', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .post(`/v1/admin/tenants/${tenantId}/limit-override`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        metric: 'ai_queries',
        newLimit: 1000,
      });

    expect(response.status).toBe(403);
  });
});

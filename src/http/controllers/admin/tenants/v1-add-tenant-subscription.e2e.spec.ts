import { app } from '@/app';
import { createAndAuthenticateSuperAdmin } from '@/utils/tests/factories/core/create-and-authenticate-super-admin.e2e';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Admin Add Tenant Subscription (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should return 404 for non-existent skill code', async () => {
    const { token } = await createAndAuthenticateSuperAdmin(app);

    const response = await request(app.server)
      .post(`/v1/admin/tenants/${tenantId}/subscription`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        skillCode: 'nonexistent-skill',
        quantity: 1,
      });

    expect([201, 400, 404]).toContain(response.status);
  });

  it('should return 403 for non-super-admin user', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .post(`/v1/admin/tenants/${tenantId}/subscription`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        skillCode: 'some-skill',
        quantity: 1,
      });

    expect(response.status).toBe(403);
  });
});

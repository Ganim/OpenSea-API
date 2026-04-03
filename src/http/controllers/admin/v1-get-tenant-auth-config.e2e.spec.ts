import { app } from '@/app';
import { createAndAuthenticateSuperAdmin } from '@/utils/tests/factories/core/create-and-authenticate-super-admin.e2e';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { prisma } from '@/lib/prisma';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Admin Get Tenant Auth Config (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;

    await prisma.tenantAuthConfig.upsert({
      where: { tenantId: tid },
      update: {},
      create: {
        tenantId: tid,
        allowedMethods: ['EMAIL'],
        magicLinkEnabled: false,
        magicLinkExpiresIn: 15,
        defaultMethod: null,
      },
    });
  });


  it('should return tenant auth config', async () => {
    const { token } = await createAndAuthenticateSuperAdmin(app);

    const response = await request(app.server)
      .get(`/v1/admin/tenants/${tenantId}/auth-config`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('config');
    expect(response.body.config).toHaveProperty('tenantId', tenantId);
    expect(response.body.config).toHaveProperty('allowedMethods');
    expect(response.body.config).toHaveProperty('magicLinkEnabled');
  });

  it('should return 403 for non-super-admin user', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .get(`/v1/admin/tenants/${tenantId}/auth-config`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
  });
});

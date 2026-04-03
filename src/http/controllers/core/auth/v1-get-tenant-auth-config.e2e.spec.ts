import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { prisma } from '@/lib/prisma';

describe('Get Tenant Auth Config (E2E)', () => {
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
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/tenant-auth-config')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('config');
    expect(response.body.config).toHaveProperty('tenantId', tenantId);
    expect(response.body.config).toHaveProperty('allowedMethods');
    expect(response.body.config).toHaveProperty('magicLinkEnabled');
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).get('/v1/tenant-auth-config');

    expect(response.status).toBe(401);
  });
});

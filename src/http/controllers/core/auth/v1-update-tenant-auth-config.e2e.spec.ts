import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { prisma } from '@/lib/prisma';

describe('Update Tenant Auth Config (E2E)', () => {
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

  it('should update tenant auth config', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .put('/v1/tenant-auth-config')
      .set('Authorization', `Bearer ${token}`)
      .send({
        allowedMethods: ['EMAIL', 'CPF'],
        magicLinkEnabled: true,
        magicLinkExpiresIn: 30,
        defaultMethod: 'EMAIL',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('config');
    expect(response.body.config.allowedMethods).toEqual(
      expect.arrayContaining(['EMAIL', 'CPF']),
    );
    expect(response.body.config.magicLinkEnabled).toBe(true);
    expect(response.body.config.magicLinkExpiresIn).toBe(30);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .put('/v1/tenant-auth-config')
      .send({
        allowedMethods: ['EMAIL'],
        magicLinkEnabled: false,
        magicLinkExpiresIn: 15,
      });

    expect(response.status).toBe(401);
  });
});

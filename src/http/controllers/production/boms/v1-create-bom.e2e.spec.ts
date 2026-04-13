import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Bom (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should create a bom', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const ts = Date.now();

    const response = await request(app.server)
      .post('/v1/production/boms')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId: `product-${ts}`,
        name: `BOM Test ${ts}`,
        description: 'Test BOM description',
        version: 1,
        isDefault: true,
        baseQuantity: 10,
      });

    expect(response.status).toBe(201);
    expect(response.body.bom).toEqual(
      expect.objectContaining({
        name: `BOM Test ${ts}`,
        description: 'Test BOM description',
        version: 1,
        isDefault: true,
        status: 'DRAFT',
      }),
    );
    expect(response.body.bom.id).toBeDefined();
    expect(response.body.bom.createdAt).toBeDefined();
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server)
      .post('/v1/production/boms')
      .send({
        productId: 'product-unauth',
        name: 'BOM Unauth',
      });

    expect(response.status).toBe(401);
  });
});

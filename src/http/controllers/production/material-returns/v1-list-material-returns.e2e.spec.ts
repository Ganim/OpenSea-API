import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProductionTestData } from '@/utils/tests/factories/production/create-production-test-data.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('List Material Returns (E2E)', () => {
  let tenantId: string;
  let token: string;
  let userId: string;
  let productionOrderId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
    userId = auth.user.user.id;

    const data = await createProductionTestData({ tenantId, userId });
    productionOrderId = data.productionOrder.id;

    await prisma.productionMaterialReturn.create({
      data: {
        productionOrderId,
        materialId: data.productId,
        warehouseId: data.warehouseId,
        quantity: 3,
        reason: 'Surplus material',
        returnedById: userId,
      },
    });
  });

  it('should list material returns', async () => {
    const response = await request(app.server)
      .get('/v1/production/material-returns')
      .query({ productionOrderId })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('materialReturns');
    expect(Array.isArray(response.body.materialReturns)).toBe(true);
    expect(response.body.materialReturns.length).toBeGreaterThanOrEqual(1);
  });
});

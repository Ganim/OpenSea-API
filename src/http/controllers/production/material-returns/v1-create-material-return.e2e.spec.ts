import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProductionTestData } from '@/utils/tests/factories/production/create-production-test-data.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Create Material Return (E2E)', () => {
  let tenantId: string;
  let token: string;
  let userId: string;
  let productionOrderId: string;
  let productId: string;
  let warehouseId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
    userId = auth.user.user.id;

    const data = await createProductionTestData({ tenantId, userId });
    productionOrderId = data.productionOrder.id;
    productId = data.productId;
    warehouseId = data.warehouseId;
  });

  it('should create a material return', async () => {
    const response = await request(app.server)
      .post('/v1/production/material-returns')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productionOrderId,
        materialId: productId,
        warehouseId,
        quantity: 5,
        reason: 'Excess material returned to warehouse',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('materialReturn');
    expect(response.body.materialReturn).toHaveProperty('id');
    expect(response.body.materialReturn.productionOrderId).toBe(productionOrderId);
    expect(response.body.materialReturn.quantity).toBe(5);
    expect(response.body.materialReturn.reason).toBe(
      'Excess material returned to warehouse',
    );
  });
});

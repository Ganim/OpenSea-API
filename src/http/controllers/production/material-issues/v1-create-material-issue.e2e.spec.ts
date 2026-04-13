import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProductionTestData } from '@/utils/tests/factories/production/create-production-test-data.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Create Material Issue (E2E)', () => {
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

  it('should create a material issue', async () => {
    const response = await request(app.server)
      .post('/v1/production/material-issues')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productionOrderId,
        materialId: productId,
        warehouseId,
        quantity: 25,
        batchNumber: `BATCH-${Date.now()}`,
        notes: 'Material issued for production',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('materialIssue');
    expect(response.body.materialIssue).toHaveProperty('id');
    expect(response.body.materialIssue.productionOrderId).toBe(productionOrderId);
    expect(response.body.materialIssue.materialId).toBe(productId);
    expect(response.body.materialIssue.quantity).toBe(25);
  });
});

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProductionTestData } from '@/utils/tests/factories/production/create-production-test-data.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Create Production Cost (E2E)', () => {
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
  });

  it('should create a production cost entry', async () => {
    const response = await request(app.server)
      .post(`/v1/production/orders/${productionOrderId}/costs`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        costType: 'MATERIAL',
        description: 'Raw material costs',
        plannedAmount: 1000,
        actualAmount: 1050,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('cost');
    expect(response.body.cost).toHaveProperty('id');
    expect(response.body.cost.productionOrderId).toBe(productionOrderId);
    expect(response.body.cost.costType).toBe('MATERIAL');
    expect(response.body.cost.plannedAmount).toBe(1000);
    expect(response.body.cost.actualAmount).toBe(1050);
  });
});

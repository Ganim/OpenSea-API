import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProductionTestData } from '@/utils/tests/factories/production/create-production-test-data.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Update Production Cost (E2E)', () => {
  let tenantId: string;
  let token: string;
  let userId: string;
  let productionOrderId: string;
  let costId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
    userId = auth.user.user.id;

    const data = await createProductionTestData({ tenantId, userId });
    productionOrderId = data.productionOrder.id;

    const cost = await prisma.productionCost.create({
      data: {
        productionOrderId,
        costType: 'OVERHEAD',
        description: 'Overhead cost',
        plannedAmount: 200,
        actualAmount: 180,
        varianceAmount: -20,
      },
    });
    costId = cost.id;
  });

  it('should update a production cost entry', async () => {
    const response = await request(app.server)
      .put(`/v1/production/orders/${productionOrderId}/costs/${costId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        costType: 'OVERHEAD',
        description: 'Updated overhead cost',
        plannedAmount: 250,
        actualAmount: 230,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('cost');
    expect(response.body.cost.id).toBe(costId);
    expect(response.body.cost.description).toBe('Updated overhead cost');
    expect(response.body.cost.plannedAmount).toBe(250);
    expect(response.body.cost.actualAmount).toBe(230);
  });
});

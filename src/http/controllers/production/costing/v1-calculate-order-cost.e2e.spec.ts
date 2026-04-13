import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProductionTestData } from '@/utils/tests/factories/production/create-production-test-data.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Calculate Order Cost (E2E)', () => {
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

    // Create some cost entries to summarize
    await prisma.productionCost.createMany({
      data: [
        {
          productionOrderId,
          costType: 'MATERIAL',
          plannedAmount: 1000,
          actualAmount: 1100,
          varianceAmount: 100,
        },
        {
          productionOrderId,
          costType: 'LABOR',
          plannedAmount: 500,
          actualAmount: 480,
          varianceAmount: -20,
        },
      ],
    });
  });

  it('should calculate order cost summary', async () => {
    const response = await request(app.server)
      .get(`/v1/production/orders/${productionOrderId}/costs/summary`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('totalPlanned');
    expect(response.body).toHaveProperty('totalActual');
    expect(response.body).toHaveProperty('totalVariance');
    expect(response.body).toHaveProperty('details');
    expect(Array.isArray(response.body.details)).toBe(true);
    expect(typeof response.body.totalPlanned).toBe('number');
  });
});

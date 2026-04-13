import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProductionTestData } from '@/utils/tests/factories/production/create-production-test-data.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('List Production Costs (E2E)', () => {
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

    await prisma.productionCost.create({
      data: {
        productionOrderId,
        costType: 'LABOR',
        description: 'Labor cost for testing',
        plannedAmount: 500,
        actualAmount: 520,
        varianceAmount: 20,
      },
    });
  });

  it('should list production costs', async () => {
    const response = await request(app.server)
      .get(`/v1/production/orders/${productionOrderId}/costs`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('costs');
    expect(Array.isArray(response.body.costs)).toBe(true);
    expect(response.body.costs.length).toBeGreaterThanOrEqual(1);
  });
});

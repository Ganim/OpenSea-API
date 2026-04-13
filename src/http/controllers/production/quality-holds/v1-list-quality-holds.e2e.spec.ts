import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProductionTestData } from '@/utils/tests/factories/production/create-production-test-data.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('List Quality Holds (E2E)', () => {
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

    // Create a quality hold directly in DB
    await prisma.productionQualityHold.create({
      data: {
        productionOrderId,
        reason: 'Test quality hold for listing',
        status: 'ACTIVE',
        holdById: userId,
      },
    });
  });

  it('should list quality holds', async () => {
    const response = await request(app.server)
      .get('/v1/production/quality-holds')
      .query({ productionOrderId })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('qualityHolds');
    expect(Array.isArray(response.body.qualityHolds)).toBe(true);
    expect(response.body.qualityHolds.length).toBeGreaterThanOrEqual(1);
  });
});

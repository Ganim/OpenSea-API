import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProductionTestData } from '@/utils/tests/factories/production/create-production-test-data.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Create Quality Hold (E2E)', () => {
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

  it('should create a quality hold', async () => {
    const response = await request(app.server)
      .post('/v1/production/quality-holds')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productionOrderId,
        reason: `Quality issue detected at ${Date.now()}`,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('qualityHold');
    expect(response.body.qualityHold).toHaveProperty('id');
    expect(response.body.qualityHold.productionOrderId).toBe(productionOrderId);
    expect(response.body.qualityHold.status).toBe('ACTIVE');
    expect(response.body.qualityHold.holdById).toBeTruthy();
  });
});

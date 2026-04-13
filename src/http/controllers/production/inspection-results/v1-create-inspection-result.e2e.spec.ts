import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProductionTestData } from '@/utils/tests/factories/production/create-production-test-data.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Create Inspection Result (E2E)', () => {
  let tenantId: string;
  let token: string;
  let userId: string;
  let inspectionPlanId: string;
  let productionOrderId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
    userId = auth.user.user.id;

    const data = await createProductionTestData({ tenantId, userId });
    inspectionPlanId = data.inspectionPlan.id;
    productionOrderId = data.productionOrder.id;
  });

  it('should create an inspection result', async () => {
    const response = await request(app.server)
      .post('/v1/production/inspection-results')
      .set('Authorization', `Bearer ${token}`)
      .send({
        inspectionPlanId,
        productionOrderId,
        sampleSize: 10,
        defectsFound: 2,
        notes: 'Minor surface scratches found',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('inspectionResult');
    expect(response.body.inspectionResult).toHaveProperty('id');
    expect(response.body.inspectionResult.inspectionPlanId).toBe(
      inspectionPlanId,
    );
    expect(response.body.inspectionResult.productionOrderId).toBe(
      productionOrderId,
    );
    expect(response.body.inspectionResult.sampleSize).toBe(10);
    expect(response.body.inspectionResult.defectsFound).toBe(2);
    expect(response.body.inspectionResult.status).toBe('PENDING');
  });
});

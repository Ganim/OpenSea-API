import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProductionTestData } from '@/utils/tests/factories/production/create-production-test-data.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Create Inspection Plan (E2E)', () => {
  let tenantId: string;
  let token: string;
  let userId: string;
  let operationRoutingId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
    userId = auth.user.user.id;

    const data = await createProductionTestData({ tenantId, userId });
    operationRoutingId = data.operationRouting.id;
  });

  it('should create an inspection plan', async () => {
    const response = await request(app.server)
      .post('/v1/production/inspection-plans')
      .set('Authorization', `Bearer ${token}`)
      .send({
        operationRoutingId,
        inspectionType: 'DIMENSIONAL',
        description: 'Check dimensions of finished product',
        sampleSize: 5,
        aqlLevel: '2.5',
        instructions: 'Measure length, width, height using caliper',
        isActive: true,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('inspectionPlan');
    expect(response.body.inspectionPlan).toHaveProperty('id');
    expect(response.body.inspectionPlan.operationRoutingId).toBe(operationRoutingId);
    expect(response.body.inspectionPlan.inspectionType).toBe('DIMENSIONAL');
    expect(response.body.inspectionPlan.sampleSize).toBe(5);
    expect(response.body.inspectionPlan.isActive).toBe(true);
  });
});

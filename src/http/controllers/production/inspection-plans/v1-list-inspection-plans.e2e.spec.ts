import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProductionTestData } from '@/utils/tests/factories/production/create-production-test-data.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('List Inspection Plans (E2E)', () => {
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
    // inspectionPlan is already created by test data factory
  });

  it('should list inspection plans', async () => {
    const response = await request(app.server)
      .get('/v1/production/inspection-plans')
      .query({ operationRoutingId })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('inspectionPlans');
    expect(Array.isArray(response.body.inspectionPlans)).toBe(true);
    expect(response.body.inspectionPlans.length).toBeGreaterThanOrEqual(1);
  });
});

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProductionTestData } from '@/utils/tests/factories/production/create-production-test-data.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Update Inspection Plan (E2E)', () => {
  let tenantId: string;
  let token: string;
  let userId: string;
  let inspectionPlanId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
    userId = auth.user.user.id;

    const data = await createProductionTestData({ tenantId, userId });
    inspectionPlanId = data.inspectionPlan.id;
  });

  it('should update an inspection plan', async () => {
    const response = await request(app.server)
      .patch(`/v1/production/inspection-plans/${inspectionPlanId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        inspectionType: 'FUNCTIONAL',
        sampleSize: 20,
        description: 'Updated inspection plan',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('inspectionPlan');
    expect(response.body.inspectionPlan.id).toBe(inspectionPlanId);
    expect(response.body.inspectionPlan.inspectionType).toBe('FUNCTIONAL');
    expect(response.body.inspectionPlan.sampleSize).toBe(20);
  });
});

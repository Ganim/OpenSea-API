import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProductionTestData } from '@/utils/tests/factories/production/create-production-test-data.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Update Inspection Result Status (E2E)', () => {
  let tenantId: string;
  let token: string;
  let userId: string;
  let inspectionResultId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
    userId = auth.user.user.id;

    const data = await createProductionTestData({ tenantId, userId });

    const inspectionResult = await prisma.productionInspectionResult.create({
      data: {
        inspectionPlanId: data.inspectionPlan.id,
        productionOrderId: data.productionOrder.id,
        inspectedById: userId,
        sampleSize: 10,
        defectsFound: 0,
        status: 'PENDING',
      },
    });
    inspectionResultId = inspectionResult.id;
  });

  it('should update inspection result status', async () => {
    const response = await request(app.server)
      .patch(
        `/v1/production/inspection-results/${inspectionResultId}/status`,
      )
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'PASSED',
        defectsFound: 0,
        notes: 'All items passed inspection',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('inspectionResult');
    expect(response.body.inspectionResult.id).toBe(inspectionResultId);
    expect(response.body.inspectionResult.status).toBe('PASSED');
  });
});

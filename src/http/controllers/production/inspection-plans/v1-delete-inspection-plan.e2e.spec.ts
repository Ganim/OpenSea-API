import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProductionTestData } from '@/utils/tests/factories/production/create-production-test-data.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Delete Inspection Plan (E2E)', () => {
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
    // Create a separate plan to delete (the default one may have results linked)
    const plan = await prisma.productionInspectionPlan.create({
      data: {
        operationRoutingId: data.operationRouting.id,
        inspectionType: 'TO_DELETE',
        sampleSize: 1,
      },
    });
    inspectionPlanId = plan.id;
  });

  it('should delete an inspection plan', async () => {
    const response = await request(app.server)
      .delete(`/v1/production/inspection-plans/${inspectionPlanId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });
});

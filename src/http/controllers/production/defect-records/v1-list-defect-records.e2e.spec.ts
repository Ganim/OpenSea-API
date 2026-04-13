import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProductionTestData } from '@/utils/tests/factories/production/create-production-test-data.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('List Defect Records (E2E)', () => {
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

    // Create an inspection result
    const inspectionResult = await prisma.productionInspectionResult.create({
      data: {
        inspectionPlanId: data.inspectionPlan.id,
        productionOrderId: data.productionOrder.id,
        inspectedById: userId,
        sampleSize: 10,
        defectsFound: 1,
      },
    });
    inspectionResultId = inspectionResult.id;

    // Create a defect record linked to it
    await prisma.productionDefectRecord.create({
      data: {
        inspectionResultId,
        defectTypeId: data.defectType.id,
        operatorId: userId,
        quantity: 2,
        severity: 'MINOR',
        description: 'Test defect for listing',
      },
    });
  });

  it('should list defect records', async () => {
    const response = await request(app.server)
      .get('/v1/production/defect-records')
      .query({ inspectionResultId })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('defectRecords');
    expect(Array.isArray(response.body.defectRecords)).toBe(true);
    expect(response.body.defectRecords.length).toBeGreaterThanOrEqual(1);
  });
});

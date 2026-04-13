import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProductionTestData } from '@/utils/tests/factories/production/create-production-test-data.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Report Production (E2E)', () => {
  let tenantId: string;
  let token: string;
  let userId: string;
  let jobCardId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
    userId = auth.user.user.id;

    const data = await createProductionTestData({ tenantId, userId });
    jobCardId = data.jobCard.id;

    // Start the job card first
    await prisma.productionJobCard.update({
      where: { id: jobCardId },
      data: { status: 'IN_PROGRESS', actualStart: new Date() },
    });
  });

  it('should report production on a job card', async () => {
    const response = await request(app.server)
      .post(`/v1/production/job-cards/${jobCardId}/report`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        operatorId: userId,
        quantityGood: 40,
        quantityScrapped: 5,
        quantityRework: 2,
        notes: 'Production report test',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('jobCard');
    expect(response.body.jobCard.id).toBe(jobCardId);
  });
});

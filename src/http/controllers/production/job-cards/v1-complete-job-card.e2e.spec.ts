import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProductionTestData } from '@/utils/tests/factories/production/create-production-test-data.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Complete Job Card (E2E)', () => {
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

    // Start the job card first so it can be completed
    await prisma.productionJobCard.update({
      where: { id: jobCardId },
      data: { status: 'IN_PROGRESS', actualStart: new Date() },
    });
  });

  it('should complete a job card', async () => {
    const response = await request(app.server)
      .post(`/v1/production/job-cards/${jobCardId}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('jobCard');
    expect(response.body.jobCard.id).toBe(jobCardId);
    expect(response.body.jobCard.status).toBe('COMPLETED');
    expect(response.body.jobCard.actualEnd).toBeTruthy();
  });
});

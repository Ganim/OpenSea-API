import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProductionTestData } from '@/utils/tests/factories/production/create-production-test-data.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Start Job Card (E2E)', () => {
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
  });

  it('should start a job card', async () => {
    const response = await request(app.server)
      .post(`/v1/production/job-cards/${jobCardId}/start`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('jobCard');
    expect(response.body.jobCard.id).toBe(jobCardId);
    expect(response.body.jobCard.status).toBe('IN_PROGRESS');
    expect(response.body.jobCard.actualStart).toBeTruthy();
  });
});

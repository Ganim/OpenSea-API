import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Publish Job Posting (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should publish a draft job posting', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const createResponse = await request(app.server)
      .post('/v1/hr/recruitment/job-postings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: `Job ${Date.now()}`,
        type: 'FULL_TIME',
      });

    const jobPostingId = createResponse.body.jobPosting.id;

    const response = await request(app.server)
      .patch(`/v1/hr/recruitment/job-postings/${jobPostingId}/publish`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('jobPosting');
    expect(response.body.jobPosting.status).toBe('OPEN');
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).patch(
      '/v1/hr/recruitment/job-postings/nonexistent-id/publish',
    );

    expect(response.statusCode).toBe(401);
  });
});

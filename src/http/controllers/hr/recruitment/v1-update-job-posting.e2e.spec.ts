import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Update Job Posting (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should update a job posting', async () => {
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
      .put(`/v1/hr/recruitment/job-postings/${jobPostingId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Updated Job Title',
        location: 'Hybrid',
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('jobPosting');
    expect(response.body.jobPosting.title).toBe('Updated Job Title');
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .put('/v1/hr/recruitment/job-postings/nonexistent-id')
      .send({ title: 'Test' });

    expect(response.statusCode).toBe(401);
  });
});

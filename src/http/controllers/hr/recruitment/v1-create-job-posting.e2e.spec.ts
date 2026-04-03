import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Job Posting (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should create a job posting', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/hr/recruitment/job-postings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: `Software Engineer ${Date.now()}`,
        description: 'Full-stack developer position',
        type: 'FULL_TIME',
        location: 'Remote',
        salaryMin: 5000,
        salaryMax: 12000,
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('jobPosting');
    expect(response.body.jobPosting).toHaveProperty('id');
    expect(response.body.jobPosting.status).toBe('DRAFT');
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/hr/recruitment/job-postings')
      .send({ title: 'Test' });

    expect(response.statusCode).toBe(401);
  });
});

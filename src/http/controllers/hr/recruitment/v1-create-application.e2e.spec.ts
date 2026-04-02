import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Application (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create an application', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    // Create a job posting
    const jpResponse = await request(app.server)
      .post('/v1/hr/recruitment/job-postings')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: `Job ${Date.now()}`, type: 'FULL_TIME' });

    // Publish it so applications can be created
    await request(app.server)
      .patch(`/v1/hr/recruitment/job-postings/${jpResponse.body.jobPosting.id}/publish`)
      .set('Authorization', `Bearer ${token}`);

    // Create a candidate
    const candResponse = await request(app.server)
      .post('/v1/hr/recruitment/candidates')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fullName: `Candidate ${Date.now()}`,
        email: `app-cand-${Date.now()}@test.com`,
        source: 'WEBSITE',
      });

    const response = await request(app.server)
      .post('/v1/hr/recruitment/applications')
      .set('Authorization', `Bearer ${token}`)
      .send({
        jobPostingId: jpResponse.body.jobPosting.id,
        candidateId: candResponse.body.candidate.id,
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('application');
    expect(response.body.application).toHaveProperty('id');
    expect(response.body.application.status).toBe('APPLIED');
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/hr/recruitment/applications')
      .send({ jobPostingId: 'x', candidateId: 'y' });

    expect(response.statusCode).toBe(401);
  });
});

import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Update Application Status (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should update an application status', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    // Setup: create job posting, publish, candidate, application
    const jpRes = await request(app.server)
      .post('/v1/hr/recruitment/job-postings')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: `Job ${Date.now()}`, type: 'FULL_TIME' });

    await request(app.server)
      .patch(
        `/v1/hr/recruitment/job-postings/${jpRes.body.jobPosting.id}/publish`,
      )
      .set('Authorization', `Bearer ${token}`);

    const candRes = await request(app.server)
      .post('/v1/hr/recruitment/candidates')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fullName: `Cand ${Date.now()}`,
        email: `upd-app-status-${Date.now()}@test.com`,
        source: 'WEBSITE',
      });

    const appRes = await request(app.server)
      .post('/v1/hr/recruitment/applications')
      .set('Authorization', `Bearer ${token}`)
      .send({
        jobPostingId: jpRes.body.jobPosting.id,
        candidateId: candRes.body.candidate.id,
      });

    const applicationId = appRes.body.application.id;

    const response = await request(app.server)
      .patch(`/v1/hr/recruitment/applications/${applicationId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'SCREENING' });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('application');
    expect(response.body.application.status).toBe('SCREENING');
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .patch('/v1/hr/recruitment/applications/nonexistent-id/status')
      .send({ status: 'SCREENING' });

    expect(response.statusCode).toBe(401);
  });
});

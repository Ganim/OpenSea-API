import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Hire Application (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should hire an application', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

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
        email: `hire-app-${Date.now()}@test.com`,
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
      .patch(`/v1/hr/recruitment/applications/${applicationId}/hire`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('application');
    expect(response.body.application.status).toBe('HIRED');
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).patch(
      '/v1/hr/recruitment/applications/nonexistent-id/hire',
    );

    expect(response.statusCode).toBe(401);
  });
});

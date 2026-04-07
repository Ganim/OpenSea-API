import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Schedule Interview (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should schedule an interview', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { employeeId } = await createEmployeeE2E({ tenantId });

    // Create job posting + publish
    const jpRes = await request(app.server)
      .post('/v1/hr/recruitment/job-postings')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: `Job ${Date.now()}`, type: 'FULL_TIME' });

    await request(app.server)
      .patch(
        `/v1/hr/recruitment/job-postings/${jpRes.body.jobPosting.id}/publish`,
      )
      .set('Authorization', `Bearer ${token}`);

    // Create candidate + application
    const candRes = await request(app.server)
      .post('/v1/hr/recruitment/candidates')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fullName: `Cand ${Date.now()}`,
        email: `sched-int-${Date.now()}@test.com`,
        source: 'WEBSITE',
      });

    const appRes = await request(app.server)
      .post('/v1/hr/recruitment/applications')
      .set('Authorization', `Bearer ${token}`)
      .send({
        jobPostingId: jpRes.body.jobPosting.id,
        candidateId: candRes.body.candidate.id,
      });

    // Create stage
    const stageRes = await request(app.server)
      .post('/v1/hr/recruitment/interview-stages')
      .set('Authorization', `Bearer ${token}`)
      .send({
        jobPostingId: jpRes.body.jobPosting.id,
        name: 'Technical',
        type: 'TECHNICAL',
      });

    const response = await request(app.server)
      .post('/v1/hr/recruitment/interviews')
      .set('Authorization', `Bearer ${token}`)
      .send({
        applicationId: appRes.body.application.id,
        interviewStageId: stageRes.body.interviewStage.id,
        interviewerId: employeeId,
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        duration: 60,
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('interview');
    expect(response.body.interview).toHaveProperty('id');
    expect(response.body.interview.status).toBe('SCHEDULED');
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/hr/recruitment/interviews')
      .send({
        applicationId: 'x',
        interviewStageId: 'x',
        interviewerId: 'x',
        scheduledAt: new Date().toISOString(),
      });

    expect(response.statusCode).toBe(401);
  });
});

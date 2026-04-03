import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Reorder Interview Stages (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should reorder interview stages', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const jpRes = await request(app.server)
      .post('/v1/hr/recruitment/job-postings')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: `Job ${Date.now()}`, type: 'FULL_TIME' });

    const jobPostingId = jpRes.body.jobPosting.id;

    // Create two stages
    const stage1Res = await request(app.server)
      .post('/v1/hr/recruitment/interview-stages')
      .set('Authorization', `Bearer ${token}`)
      .send({ jobPostingId, name: 'Stage A', type: 'SCREENING' });

    const stage2Res = await request(app.server)
      .post('/v1/hr/recruitment/interview-stages')
      .set('Authorization', `Bearer ${token}`)
      .send({ jobPostingId, name: 'Stage B', type: 'TECHNICAL' });

    const response = await request(app.server)
      .patch(`/v1/hr/recruitment/job-postings/${jobPostingId}/stages/reorder`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        stageIds: [
          stage2Res.body.interviewStage.id,
          stage1Res.body.interviewStage.id,
        ],
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('success', true);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .patch('/v1/hr/recruitment/job-postings/nonexistent-id/stages/reorder')
      .send({ stageIds: ['a'] });

    expect(response.statusCode).toBe(401);
  });
});

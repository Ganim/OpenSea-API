import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Delete Interview Stage (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should delete an interview stage', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const jpRes = await request(app.server)
      .post('/v1/hr/recruitment/job-postings')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: `Job ${Date.now()}`, type: 'FULL_TIME' });

    const stageRes = await request(app.server)
      .post('/v1/hr/recruitment/interview-stages')
      .set('Authorization', `Bearer ${token}`)
      .send({
        jobPostingId: jpRes.body.jobPosting.id,
        name: 'Stage to Delete',
        type: 'SCREENING',
      });

    const stageId = stageRes.body.interviewStage.id;

    const response = await request(app.server)
      .delete(`/v1/hr/recruitment/interview-stages/${stageId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(204);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).delete(
      '/v1/hr/recruitment/interview-stages/nonexistent-id',
    );

    expect(response.statusCode).toBe(401);
  });
});

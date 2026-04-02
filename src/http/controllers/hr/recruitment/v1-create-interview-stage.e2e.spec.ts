import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Interview Stage (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create an interview stage', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const jpRes = await request(app.server)
      .post('/v1/hr/recruitment/job-postings')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: `Job ${Date.now()}`, type: 'FULL_TIME' });

    const response = await request(app.server)
      .post('/v1/hr/recruitment/interview-stages')
      .set('Authorization', `Bearer ${token}`)
      .send({
        jobPostingId: jpRes.body.jobPosting.id,
        name: 'Technical Interview',
        type: 'TECHNICAL',
        description: 'Coding assessment',
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('interviewStage');
    expect(response.body.interviewStage.name).toBe('Technical Interview');
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/hr/recruitment/interview-stages')
      .send({ jobPostingId: 'x', name: 'Test' });

    expect(response.statusCode).toBe(401);
  });
});

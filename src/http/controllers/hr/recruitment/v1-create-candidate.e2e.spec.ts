import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Candidate (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should create a candidate', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/hr/recruitment/candidates')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fullName: `Candidate ${Date.now()}`,
        email: `candidate-${Date.now()}@test.com`,
        phone: '11999990000',
        source: 'WEBSITE',
        tags: ['developer', 'senior'],
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('candidate');
    expect(response.body.candidate).toHaveProperty('id');
    expect(response.body.candidate.source).toBe('WEBSITE');
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/hr/recruitment/candidates')
      .send({
        fullName: 'Candidate Test',
        email: 'candidate@test.com',
      });

    expect(response.statusCode).toBe(401);
  });
});

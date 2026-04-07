import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Get Candidate (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should get a candidate by ID', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    // Create a candidate first
    const createResponse = await request(app.server)
      .post('/v1/hr/recruitment/candidates')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fullName: `Candidate ${Date.now()}`,
        email: `get-cand-${Date.now()}@test.com`,
        source: 'LINKEDIN',
      });

    const candidateId = createResponse.body.candidate.id;

    const response = await request(app.server)
      .get(`/v1/hr/recruitment/candidates/${candidateId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('candidate');
    expect(response.body.candidate.id).toBe(candidateId);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).get(
      '/v1/hr/recruitment/candidates/nonexistent-id',
    );

    expect(response.statusCode).toBe(401);
  });
});

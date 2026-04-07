import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('List Job Postings (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should list job postings', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/hr/recruitment/job-postings')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('jobPostings');
    expect(response.body).toHaveProperty('total');
    expect(Array.isArray(response.body.jobPostings)).toBe(true);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).get(
      '/v1/hr/recruitment/job-postings',
    );

    expect(response.statusCode).toBe(401);
  });
});

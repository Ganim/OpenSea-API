import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Review Cycle (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should create a review cycle', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/hr/review-cycles')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Review Cycle ${Date.now()}`,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'ANNUAL',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('reviewCycle');
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server)
      .post('/v1/hr/review-cycles')
      .send({ name: 'Test', type: 'ANNUAL' });

    expect(response.status).toBe(401);
  });
});

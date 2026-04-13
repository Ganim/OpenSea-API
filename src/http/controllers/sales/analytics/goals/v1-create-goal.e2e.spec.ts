import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Goal (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/sales/analytics/goals')
      .send({ name: 'Test Goal' });

    expect(response.status).toBe(401);
  });

  it('should create a goal (201)', async () => {
    const response = await request(app.server)
      .post('/v1/sales/analytics/goals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Goal E2E ${Date.now()}`,
        type: 'REVENUE',
        targetValue: 50000,
        period: 'MONTHLY',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

    expect(response.status).toBe(201);
    expect(response.body.goal).toBeDefined();
    expect(response.body.goal).toHaveProperty('id');
  });
});

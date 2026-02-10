import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Get Forecast (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return forecast data', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const response = await request(app.server)
      .get('/v1/finance/forecast')
      .query({ startDate, endDate, groupBy: 'month' })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server)
      .get('/v1/finance/forecast')
      .query({ startDate: '2026-01-01', endDate: '2026-03-31' });

    expect(response.status).toBe(401);
  });
});

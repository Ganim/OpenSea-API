import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('List Insights (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list insights (200)', async () => {
    const response = await request(app.server)
      .get('/v1/ai/insights')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('insights');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.insights)).toBe(true);
    expect(response.body.meta).toHaveProperty('total');
    expect(response.body.meta).toHaveProperty('page');
    expect(response.body.meta).toHaveProperty('limit');
    expect(response.body.meta).toHaveProperty('pages');
  });

  it('should filter by status', async () => {
    const response = await request(app.server)
      .get('/v1/ai/insights')
      .query({ status: 'DISMISSED' })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('insights');
    for (const insight of response.body.insights) {
      expect(insight.status).toBe('DISMISSED');
    }
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).get('/v1/ai/insights');

    expect(response.status).toBe(401);
  });
});

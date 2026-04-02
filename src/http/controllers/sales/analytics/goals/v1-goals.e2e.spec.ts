import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Analytics Goals (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /v1/sales/analytics/goals', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .post('/v1/sales/analytics/goals')
        .send({ name: 'Test Goal' });

      expect(response.status).toBe(401);
    });

    it('should create a goal', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .post('/v1/sales/analytics/goals')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: `Goal E2E ${Date.now()}`,
          type: 'REVENUE',
          targetValue: 10000,
          period: 'MONTHLY',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          scope: 'TENANT',
        });

      expect(response.status).toBe(201);
      expect(response.body.goal).toBeDefined();
    });
  });

  describe('GET /v1/sales/analytics/goals', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .get('/v1/sales/analytics/goals');

      expect(response.status).toBe(401);
    });

    it('should list goals', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .get('/v1/sales/analytics/goals')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.goals).toBeDefined();
      expect(Array.isArray(response.body.goals)).toBe(true);
    });
  });

  describe('PATCH /v1/sales/analytics/goals/:id', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .patch('/v1/sales/analytics/goals/00000000-0000-0000-0000-000000000001')
        .send({ name: 'Updated Goal' });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /v1/sales/analytics/goals/:id', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .delete('/v1/sales/analytics/goals/00000000-0000-0000-0000-000000000001');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /v1/sales/analytics/goals/:id/progress', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .get('/v1/sales/analytics/goals/00000000-0000-0000-0000-000000000001/progress');

      expect(response.status).toBe(401);
    });
  });
});

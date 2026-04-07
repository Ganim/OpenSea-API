import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Analytics Rankings (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  describe('GET /v1/sales/analytics/rankings/sellers', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server).get(
        '/v1/sales/analytics/rankings/sellers',
      );

      expect(response.status).toBe(401);
    });

    it('should get seller ranking', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .get('/v1/sales/analytics/rankings/sellers')
        .set('Authorization', `Bearer ${token}`)
        .query({ period: 'month', limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.rankings).toBeDefined();
      expect(response.body.period).toBe('month');
    });
  });

  describe('GET /v1/sales/analytics/rankings/products', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server).get(
        '/v1/sales/analytics/rankings/products',
      );

      expect(response.status).toBe(401);
    });

    it('should get product ranking', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .get('/v1/sales/analytics/rankings/products')
        .set('Authorization', `Bearer ${token}`)
        .query({ period: 'month', limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.rankings).toBeDefined();
      expect(response.body.period).toBe('month');
    });
  });

  describe('GET /v1/sales/analytics/rankings/customers', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server).get(
        '/v1/sales/analytics/rankings/customers',
      );

      expect(response.status).toBe(401);
    });

    it('should get customer ranking', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .get('/v1/sales/analytics/rankings/customers')
        .set('Authorization', `Bearer ${token}`)
        .query({ period: 'month', limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.rankings).toBeDefined();
      expect(response.body.period).toBe('month');
    });
  });
});

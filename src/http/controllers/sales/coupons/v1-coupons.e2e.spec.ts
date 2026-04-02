import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Coupons (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /v1/coupons', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .post('/v1/coupons')
        .send({ code: 'TEST10' });

      expect(response.status).toBe(401);
    });

    it('should create a coupon', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .post('/v1/coupons')
        .set('Authorization', `Bearer ${token}`)
        .send({
          code: `COUPON${Date.now()}`,
          type: 'PERCENTAGE',
          value: 10,
          applicableTo: 'ALL',
          validFrom: new Date().toISOString(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });

      expect(response.status).toBe(201);
      expect(response.body.coupon).toBeDefined();
    });
  });

  describe('GET /v1/coupons', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .get('/v1/coupons');

      expect(response.status).toBe(401);
    });

    it('should list coupons', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .get('/v1/coupons')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.coupons).toBeDefined();
      expect(Array.isArray(response.body.coupons)).toBe(true);
      expect(response.body.meta).toBeDefined();
    });
  });

  describe('GET /v1/coupons/:id', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .get('/v1/coupons/00000000-0000-0000-0000-000000000001');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /v1/coupons/:id', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .put('/v1/coupons/00000000-0000-0000-0000-000000000001')
        .send({ code: 'UPDATED' });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /v1/coupons/:id', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .delete('/v1/coupons/00000000-0000-0000-0000-000000000001');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /v1/coupons/validate', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .post('/v1/coupons/validate')
        .send({ code: 'TEST10' });

      expect(response.status).toBe(401);
    });
  });
});

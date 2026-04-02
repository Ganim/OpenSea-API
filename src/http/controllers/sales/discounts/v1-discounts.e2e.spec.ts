import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Discounts (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /v1/sales/discount-rules', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .post('/v1/sales/discount-rules')
        .send({ name: 'Test Discount' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /v1/sales/discount-rules', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .get('/v1/sales/discount-rules');

      expect(response.status).toBe(401);
    });

    it('should list discount rules', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .get('/v1/sales/discount-rules')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.discountRules).toBeDefined();
      expect(Array.isArray(response.body.discountRules)).toBe(true);
    });
  });

  describe('GET /v1/sales/discount-rules/:id', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .get('/v1/sales/discount-rules/00000000-0000-0000-0000-000000000001');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /v1/sales/discount-rules/:id', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .put('/v1/sales/discount-rules/00000000-0000-0000-0000-000000000001')
        .send({ name: 'Updated Discount' });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /v1/sales/discount-rules/:id', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .delete('/v1/sales/discount-rules/00000000-0000-0000-0000-000000000001');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /v1/sales/discount-rules/validate', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .post('/v1/sales/discount-rules/validate')
        .send({});

      expect(response.status).toBe(401);
    });
  });
});

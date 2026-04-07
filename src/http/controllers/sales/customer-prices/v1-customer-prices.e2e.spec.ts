import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Customer Prices (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  describe('POST /v1/customer-prices', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .post('/v1/customer-prices')
        .send({
          customerId: '00000000-0000-0000-0000-000000000001',
          variantId: '00000000-0000-0000-0000-000000000002',
          price: 99.99,
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /v1/customer-prices', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server).get('/v1/customer-prices');

      expect(response.status).toBe(401);
    });

    it('should list customer prices', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .get('/v1/customer-prices')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.customerPrices).toBeDefined();
      expect(Array.isArray(response.body.customerPrices)).toBe(true);
      expect(response.body.meta).toBeDefined();
    });
  });

  describe('PUT /v1/customer-prices/:id', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .put('/v1/customer-prices/00000000-0000-0000-0000-000000000001')
        .send({ price: 199.99 });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /v1/customer-prices/:id', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server).delete(
        '/v1/customer-prices/00000000-0000-0000-0000-000000000001',
      );

      expect(response.status).toBe(401);
    });
  });
});

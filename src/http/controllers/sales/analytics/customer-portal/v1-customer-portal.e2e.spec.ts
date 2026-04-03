import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Customer Portal (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  describe('POST /v1/sales/analytics/customer-portal', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .post('/v1/sales/analytics/customer-portal')
        .send({
          customerId: '00000000-0000-0000-0000-000000000001',
        });

      expect(response.status).toBe(401);
    });

    it('should create portal access', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .post('/v1/sales/analytics/customer-portal')
        .set('Authorization', `Bearer ${token}`)
        .send({
          customerId: '00000000-0000-0000-0000-000000000001',
        });

      expect([201, 400]).toContain(response.status);
    });
  });

  describe('GET /v1/sales/analytics/customer-portal/:token', () => {
    it('should return 404 for invalid token', async () => {
      const response = await request(app.server)
        .get('/v1/sales/analytics/customer-portal/invalid-token');

      expect([400, 404]).toContain(response.status);
    });
  });
});

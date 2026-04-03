import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Analytics Reports (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  describe('POST /v1/sales/analytics/reports', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .post('/v1/sales/analytics/reports')
        .send({ name: 'Test Report' });

      expect(response.status).toBe(401);
    });

    it('should create a report', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .post('/v1/sales/analytics/reports')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: `Report E2E ${Date.now()}`,
          type: 'SALES_SUMMARY',
          format: 'PDF',
        });

      expect(response.status).toBe(201);
      expect(response.body.report).toBeDefined();
    });
  });

  describe('GET /v1/sales/analytics/reports', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .get('/v1/sales/analytics/reports');

      expect(response.status).toBe(401);
    });

    it('should list reports', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .get('/v1/sales/analytics/reports')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.reports).toBeDefined();
      expect(Array.isArray(response.body.reports)).toBe(true);
    });
  });
});

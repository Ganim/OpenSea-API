import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Analytics Dashboards (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  describe('POST /v1/sales/analytics/dashboards', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .post('/v1/sales/analytics/dashboards')
        .send({ name: 'Test Dashboard' });

      expect(response.status).toBe(401);
    });

    it('should create a dashboard', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .post('/v1/sales/analytics/dashboards')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: `Dashboard E2E ${Date.now()}`,
          description: 'Test dashboard',
          role: 'SELLER',
          visibility: 'PRIVATE',
        });

      expect(response.status).toBe(201);
      expect(response.body.dashboard).toBeDefined();
    });
  });

  describe('GET /v1/sales/analytics/dashboards', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server).get(
        '/v1/sales/analytics/dashboards',
      );

      expect(response.status).toBe(401);
    });

    it('should list dashboards', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .get('/v1/sales/analytics/dashboards')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.dashboards).toBeDefined();
      expect(Array.isArray(response.body.dashboards)).toBe(true);
    });
  });
});

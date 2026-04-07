import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Integrations (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  describe('GET /v1/sales/integrations', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server).get('/v1/sales/integrations');

      expect(response.status).toBe(401);
    });

    it('should list integrations', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .get('/v1/sales/integrations')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.integrations).toBeDefined();
      expect(Array.isArray(response.body.integrations)).toBe(true);
    });
  });

  describe('GET /v1/sales/integrations/:integrationId', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server).get(
        '/v1/sales/integrations/00000000-0000-0000-0000-000000000001',
      );

      expect(response.status).toBe(401);
    });
  });

  describe('GET /v1/sales/integrations/tenant', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server).get(
        '/v1/sales/integrations/tenant',
      );

      expect(response.status).toBe(401);
    });

    it('should list tenant integrations', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .get('/v1/sales/integrations/tenant')
        .set('Authorization', `Bearer ${token}`);

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('POST /v1/sales/integrations/connect', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .post('/v1/sales/integrations/connect')
        .send({
          integrationId: '00000000-0000-0000-0000-000000000001',
          config: {},
        });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /v1/sales/integrations/:tenantIntegrationId/disconnect', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server).post(
        '/v1/sales/integrations/00000000-0000-0000-0000-000000000001/disconnect',
      );

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /v1/sales/integrations/:tenantIntegrationId/config', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .patch(
          '/v1/sales/integrations/00000000-0000-0000-0000-000000000001/config',
        )
        .send({ config: {} });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /v1/sales/integrations/:tenantIntegrationId/sync', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server).post(
        '/v1/sales/integrations/00000000-0000-0000-0000-000000000001/sync',
      );

      expect(response.status).toBe(401);
    });
  });
});

import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Campaigns (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /v1/campaigns', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .post('/v1/campaigns')
        .send({ name: 'Test Campaign' });

      expect(response.status).toBe(401);
    });

    it('should create a campaign', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .post('/v1/campaigns')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: `Campaign E2E ${Date.now()}`,
          type: 'PERCENTAGE',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });

      expect(response.status).toBe(201);
      expect(response.body.campaign).toBeDefined();
    });
  });

  describe('GET /v1/campaigns', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .get('/v1/campaigns');

      expect(response.status).toBe(401);
    });

    it('should list campaigns', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .get('/v1/campaigns')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.campaigns).toBeDefined();
      expect(Array.isArray(response.body.campaigns)).toBe(true);
      expect(response.body.meta).toBeDefined();
    });
  });

  describe('GET /v1/campaigns/:id', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .get('/v1/campaigns/00000000-0000-0000-0000-000000000001');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /v1/campaigns/:id', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .put('/v1/campaigns/00000000-0000-0000-0000-000000000001')
        .send({ name: 'Updated Campaign' });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /v1/campaigns/:id', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .delete('/v1/campaigns/00000000-0000-0000-0000-000000000001');

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /v1/campaigns/:id/activate', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .patch('/v1/campaigns/00000000-0000-0000-0000-000000000001/activate');

      expect(response.status).toBe(401);
    });
  });
});

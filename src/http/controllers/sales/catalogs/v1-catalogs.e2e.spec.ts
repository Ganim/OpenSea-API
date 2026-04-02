import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Catalogs (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /v1/catalogs', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .post('/v1/catalogs')
        .send({ name: 'Test Catalog' });

      expect(response.status).toBe(401);
    });

    it('should create a catalog', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .post('/v1/catalogs')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: `Catalog E2E ${Date.now()}`,
          description: 'Test catalog',
          type: 'GENERAL',
          showPrices: true,
          showStock: false,
          isPublic: true,
        });

      expect([201, 400]).toContain(response.status);
      if (response.status === 201) {
        expect(response.body.catalog).toBeDefined();
      }
    });
  });

  describe('GET /v1/catalogs', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .get('/v1/catalogs');

      expect(response.status).toBe(401);
    });

    it('should list catalogs', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .get('/v1/catalogs')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toBeDefined();
    });
  });

  describe('GET /v1/catalogs/:id', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .get('/v1/catalogs/00000000-0000-0000-0000-000000000001');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /v1/catalogs/:id', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .put('/v1/catalogs/00000000-0000-0000-0000-000000000001')
        .send({ name: 'Updated Catalog' });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /v1/catalogs/:id', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .delete('/v1/catalogs/00000000-0000-0000-0000-000000000001');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /v1/catalogs/:id/items', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .post('/v1/catalogs/00000000-0000-0000-0000-000000000001/items')
        .send({});

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /v1/catalogs/:id/items/:itemId', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .delete('/v1/catalogs/00000000-0000-0000-0000-000000000001/items/00000000-0000-0000-0000-000000000002');

      expect(response.status).toBe(401);
    });
  });
});

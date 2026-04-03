import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Combos (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  describe('POST /v1/combos', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .post('/v1/combos')
        .send({ name: 'Test Combo' });

      expect(response.status).toBe(401);
    });

    it('should create a combo', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .post('/v1/combos')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: `Combo E2E ${Date.now()}`,
          description: 'Test combo',
          type: 'FIXED',
          discountType: 'PERCENTAGE',
          discountValue: 10,
          isActive: true,
        });

      expect(response.status).toBe(201);
      expect(response.body.combo).toBeDefined();
    });
  });

  describe('GET /v1/combos', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .get('/v1/combos');

      expect(response.status).toBe(401);
    });

    it('should list combos', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .get('/v1/combos')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.combos).toBeDefined();
      expect(Array.isArray(response.body.combos)).toBe(true);
      expect(response.body.meta).toBeDefined();
    });
  });

  describe('GET /v1/combos/:id', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .get('/v1/combos/00000000-0000-0000-0000-000000000001');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /v1/combos/:id', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .put('/v1/combos/00000000-0000-0000-0000-000000000001')
        .send({ name: 'Updated Combo' });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /v1/combos/:id', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .delete('/v1/combos/00000000-0000-0000-0000-000000000001');

      expect(response.status).toBe(401);
    });
  });
});

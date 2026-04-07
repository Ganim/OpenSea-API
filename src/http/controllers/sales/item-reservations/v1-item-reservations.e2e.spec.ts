import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Item Reservations (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  describe('POST /v1/item-reservations', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .post('/v1/item-reservations')
        .send({
          itemId: '00000000-0000-0000-0000-000000000001',
          quantity: 1,
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /v1/item-reservations', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server).get('/v1/item-reservations');

      expect(response.status).toBe(401);
    });

    it('should list item reservations', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .get('/v1/item-reservations')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.reservations).toBeDefined();
      expect(Array.isArray(response.body.reservations)).toBe(true);
    });
  });

  describe('GET /v1/item-reservations/:id', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server).get(
        '/v1/item-reservations/00000000-0000-0000-0000-000000000001',
      );

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /v1/item-reservations/:id/release', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server).patch(
        '/v1/item-reservations/00000000-0000-0000-0000-000000000001/release',
      );

      expect(response.status).toBe(401);
    });
  });
});

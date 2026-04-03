import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Deals (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  describe('POST /v1/deals', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .post('/v1/deals')
        .send({ title: 'Test Deal' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /v1/deals', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .get('/v1/deals');

      expect(response.status).toBe(401);
    });

    it('should list deals', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .get('/v1/deals')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.deals).toBeDefined();
      expect(Array.isArray(response.body.deals)).toBe(true);
      expect(response.body.meta).toBeDefined();
    });
  });

  describe('GET /v1/deals/:id', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .get('/v1/deals/00000000-0000-0000-0000-000000000001');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /v1/deals/:id', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .put('/v1/deals/00000000-0000-0000-0000-000000000001')
        .send({ title: 'Updated Deal' });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /v1/deals/:id', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .delete('/v1/deals/00000000-0000-0000-0000-000000000001');

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /v1/deals/:id/stage', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .patch('/v1/deals/00000000-0000-0000-0000-000000000001/stage')
        .send({ stageId: '00000000-0000-0000-0000-000000000002' });

      expect(response.status).toBe(401);
    });
  });
});

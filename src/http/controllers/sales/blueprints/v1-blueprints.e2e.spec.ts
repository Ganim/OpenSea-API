import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Blueprints (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  describe('POST /v1/sales/blueprints', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .post('/v1/sales/blueprints')
        .send({ name: 'Test Blueprint' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /v1/sales/blueprints', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .get('/v1/sales/blueprints');

      expect(response.status).toBe(401);
    });

    it('should list blueprints', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .get('/v1/sales/blueprints')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.blueprints).toBeDefined();
      expect(Array.isArray(response.body.blueprints)).toBe(true);
      expect(response.body.meta).toBeDefined();
    });
  });

  describe('GET /v1/sales/blueprints/:blueprintId', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .get('/v1/sales/blueprints/00000000-0000-0000-0000-000000000001');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /v1/sales/blueprints/:blueprintId', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .put('/v1/sales/blueprints/00000000-0000-0000-0000-000000000001')
        .send({ name: 'Updated Blueprint' });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /v1/sales/blueprints/:blueprintId', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .delete('/v1/sales/blueprints/00000000-0000-0000-0000-000000000001');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /v1/sales/blueprints/validate-transition', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .post('/v1/sales/blueprints/validate-transition')
        .send({
          dealId: '00000000-0000-0000-0000-000000000001',
          targetStageId: '00000000-0000-0000-0000-000000000002',
        });

      expect(response.status).toBe(401);
    });
  });
});

import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Cadences (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  describe('POST /v1/sales/cadences', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .post('/v1/sales/cadences')
        .send({ name: 'Test Cadence' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /v1/sales/cadences', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .get('/v1/sales/cadences');

      expect(response.status).toBe(401);
    });

    it('should list cadence sequences', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .get('/v1/sales/cadences')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toBeDefined();
    });
  });

  describe('GET /v1/sales/cadences/:id', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .get('/v1/sales/cadences/00000000-0000-0000-0000-000000000001');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /v1/sales/cadences/:id', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .put('/v1/sales/cadences/00000000-0000-0000-0000-000000000001')
        .send({ name: 'Updated Cadence' });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /v1/sales/cadences/:id', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .delete('/v1/sales/cadences/00000000-0000-0000-0000-000000000001');

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /v1/sales/cadences/:id/activate', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .patch('/v1/sales/cadences/00000000-0000-0000-0000-000000000001/activate');

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /v1/sales/cadences/:id/deactivate', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .patch('/v1/sales/cadences/00000000-0000-0000-0000-000000000001/deactivate');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /v1/sales/cadences/:id/enroll', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .post('/v1/sales/cadences/00000000-0000-0000-0000-000000000001/enroll')
        .send({ contactId: '00000000-0000-0000-0000-000000000002' });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /v1/sales/cadences/enrollments/:enrollmentId/advance', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .post('/v1/sales/cadences/enrollments/00000000-0000-0000-0000-000000000001/advance');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /v1/sales/cadences/process-pending', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .post('/v1/sales/cadences/process-pending');

      expect(response.status).toBe(401);
    });

    it('should process pending actions', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .post('/v1/sales/cadences/process-pending')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.processedCount).toBeDefined();
    });
  });
});

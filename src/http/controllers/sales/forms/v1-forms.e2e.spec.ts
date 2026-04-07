import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Forms (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  describe('POST /v1/sales/forms', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .post('/v1/sales/forms')
        .send({ title: 'Test Form' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /v1/sales/forms', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server).get('/v1/sales/forms');

      expect(response.status).toBe(401);
    });

    it('should list forms', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .get('/v1/sales/forms')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.forms).toBeDefined();
      expect(Array.isArray(response.body.forms)).toBe(true);
    });
  });

  describe('GET /v1/sales/forms/:id', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server).get(
        '/v1/sales/forms/00000000-0000-0000-0000-000000000001',
      );

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /v1/sales/forms/:id', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .put('/v1/sales/forms/00000000-0000-0000-0000-000000000001')
        .send({ title: 'Updated Form' });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /v1/sales/forms/:id', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server).delete(
        '/v1/sales/forms/00000000-0000-0000-0000-000000000001',
      );

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /v1/sales/forms/:id/publish', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server).patch(
        '/v1/sales/forms/00000000-0000-0000-0000-000000000001/publish',
      );

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /v1/sales/forms/:id/unpublish', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server).patch(
        '/v1/sales/forms/00000000-0000-0000-0000-000000000001/unpublish',
      );

      expect(response.status).toBe(401);
    });
  });

  describe('POST /v1/sales/forms/:id/duplicate', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server).post(
        '/v1/sales/forms/00000000-0000-0000-0000-000000000001/duplicate',
      );

      expect(response.status).toBe(401);
    });
  });

  describe('POST /v1/sales/forms/:id/submit', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .post('/v1/sales/forms/00000000-0000-0000-0000-000000000001/submit')
        .send({ data: {} });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /v1/sales/forms/:id/submissions', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server).get(
        '/v1/sales/forms/00000000-0000-0000-0000-000000000001/submissions',
      );

      expect(response.status).toBe(401);
    });
  });
});

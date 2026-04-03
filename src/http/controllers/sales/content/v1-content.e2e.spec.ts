import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Content (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  describe('POST /v1/content/generate', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .post('/v1/content/generate')
        .send({ type: 'EMAIL', channel: 'EMAIL' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /v1/content', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .get('/v1/content');

      expect(response.status).toBe(401);
    });

    it('should list contents', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .get('/v1/content')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toBeDefined();
    });
  });

  describe('GET /v1/content/:id', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .get('/v1/content/00000000-0000-0000-0000-000000000001');

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /v1/content/:id/approve', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .patch('/v1/content/00000000-0000-0000-0000-000000000001/approve');

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /v1/content/:id', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .delete('/v1/content/00000000-0000-0000-0000-000000000001');

      expect(response.status).toBe(401);
    });
  });
});

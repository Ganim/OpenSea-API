import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Conversations (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  describe('POST /v1/sales/conversations', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .post('/v1/sales/conversations')
        .send({ subject: 'Test Conversation' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /v1/sales/conversations', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server).get('/v1/sales/conversations');

      expect(response.status).toBe(401);
    });

    it('should list conversations', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .get('/v1/sales/conversations')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.conversations).toBeDefined();
      expect(Array.isArray(response.body.conversations)).toBe(true);
    });
  });

  describe('GET /v1/sales/conversations/:id', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server).get(
        '/v1/sales/conversations/00000000-0000-0000-0000-000000000001',
      );

      expect(response.status).toBe(401);
    });
  });

  describe('POST /v1/sales/conversations/:id/messages', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .post(
          '/v1/sales/conversations/00000000-0000-0000-0000-000000000001/messages',
        )
        .send({ content: 'Test message' });

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /v1/sales/conversations/:id/read', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server).patch(
        '/v1/sales/conversations/00000000-0000-0000-0000-000000000001/read',
      );

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /v1/sales/conversations/:id/close', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server).patch(
        '/v1/sales/conversations/00000000-0000-0000-0000-000000000001/close',
      );

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /v1/sales/conversations/:id/archive', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server).patch(
        '/v1/sales/conversations/00000000-0000-0000-0000-000000000001/archive',
      );

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /v1/sales/conversations/:id', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server).delete(
        '/v1/sales/conversations/00000000-0000-0000-0000-000000000001',
      );

      expect(response.status).toBe(401);
    });
  });
});

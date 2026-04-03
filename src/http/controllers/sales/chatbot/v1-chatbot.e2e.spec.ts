import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Chatbot (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  describe('GET /v1/sales/chatbot/config', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .get('/v1/sales/chatbot/config');

      expect(response.status).toBe(401);
    });

    it('should get chatbot config', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .get('/v1/sales/chatbot/config')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      // chatbotConfig can be null if not configured yet
      expect(response.body).toHaveProperty('chatbotConfig');
    });
  });

  describe('PUT /v1/sales/chatbot/config', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .put('/v1/sales/chatbot/config')
        .send({ isActive: true });

      expect(response.status).toBe(401);
    });
  });
});

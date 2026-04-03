import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Bid Bot (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  describe('GET /v1/bid-bot', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .get('/v1/bid-bot');

      expect(response.status).toBe(401);
    });

    it('should list bid bot configs', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .get('/v1/bid-bot')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.bidBotConfigs).toBeDefined();
      expect(Array.isArray(response.body.bidBotConfigs)).toBe(true);
      expect(response.body.meta).toBeDefined();
    });
  });
});

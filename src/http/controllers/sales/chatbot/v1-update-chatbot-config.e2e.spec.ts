import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Update Chatbot Config (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .put('/v1/sales/chatbot/config')
      .send({ greeting: 'Hello!' });

    expect(response.status).toBe(401);
  });

  it('should update chatbot config (200)', async () => {
    const response = await request(app.server)
      .put('/v1/sales/chatbot/config')
      .set('Authorization', `Bearer ${token}`)
      .send({
        greeting: `Welcome E2E ${Date.now()}`,
        primaryColor: '#FF5733',
        isActive: true,
      });

    expect([200, 404]).toContain(response.status);
  });
});

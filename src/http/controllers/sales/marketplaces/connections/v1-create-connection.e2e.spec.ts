import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Marketplace Connection (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should create a marketplace connection', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/marketplace-connections')
      .set('Authorization', `Bearer ${token}`)
      .send({
        marketplace: 'MERCADO_LIVRE',
        name: `ML Connection ${Date.now()}`,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('connection');
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/marketplace-connections')
      .send({ marketplace: 'MERCADO_LIVRE', name: 'No Auth' });

    expect(response.status).toBe(401);
  });
});

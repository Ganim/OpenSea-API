import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Marketplaces (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });


  it('POST /v1/marketplaces/connections should create a connection (201)', async () => {
    const response = await request(app.server)
      .post('/v1/marketplaces/connections')
      .set('Authorization', `Bearer ${token}`)
      .send({
        platform: 'MERCADO_LIVRE',
        name: 'Minha Loja ML',
        sellerId: 'MLB123456',
        autoSync: true,
        syncIntervalMinutes: 30,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('connection');
    expect(response.body.connection).toHaveProperty('id');
    expect(response.body.connection.name).toBe('Minha Loja ML');
    expect(response.body.connection.platform).toBe('MERCADO_LIVRE');
  });

  it('GET /v1/marketplaces/connections should list connections (200)', async () => {
    const response = await request(app.server)
      .get('/v1/marketplaces/connections')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('connections');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.connections)).toBe(true);
  });
});

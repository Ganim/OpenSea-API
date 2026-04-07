import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Favorite (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });

  it('should create a favorite query (201)', async () => {
    const response = await request(app.server)
      .post('/v1/ai/favorites')
      .set('Authorization', `Bearer ${token}`)
      .send({
        query: `vendas do mes ${Date.now()}`,
        category: 'SALES',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('favorite');
    expect(response.body.favorite).toHaveProperty('id');
    expect(response.body.favorite).toHaveProperty('query');
    expect(response.body.favorite.category).toBe('SALES');
    expect(response.body.favorite).toHaveProperty('tenantId');
    expect(response.body.favorite).toHaveProperty('userId');
    expect(response.body.favorite).toHaveProperty('usageCount');
    expect(response.body.favorite).toHaveProperty('createdAt');
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).post('/v1/ai/favorites').send({
      query: 'vendas do mes',
      category: 'SALES',
    });

    expect(response.status).toBe(401);
  });
});

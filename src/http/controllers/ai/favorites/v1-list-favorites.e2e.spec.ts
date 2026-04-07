import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('List Favorites (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });

  it('should list favorites (200)', async () => {
    // Create a favorite first to ensure there is at least one
    await request(app.server)
      .post('/v1/ai/favorites')
      .set('Authorization', `Bearer ${token}`)
      .send({
        query: `produtos em estoque ${Date.now()}`,
        category: 'STOCK',
      });

    const response = await request(app.server)
      .get('/v1/ai/favorites')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('favorites');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.favorites)).toBe(true);
    expect(response.body.favorites.length).toBeGreaterThan(0);
    expect(response.body.meta).toHaveProperty('total');
    expect(response.body.meta).toHaveProperty('page');
    expect(response.body.meta).toHaveProperty('limit');
    expect(response.body.meta).toHaveProperty('pages');
  });

  it('should filter by category', async () => {
    const response = await request(app.server)
      .get('/v1/ai/favorites')
      .query({ category: 'STOCK' })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('favorites');
    for (const favorite of response.body.favorites) {
      expect(favorite.category).toBe('STOCK');
    }
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).get('/v1/ai/favorites');

    expect(response.status).toBe(401);
  });
});

import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('AI Favorites (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });


  it('POST /v1/ai/favorites — should create a favorite query', async () => {
    const response = await request(app.server)
      .post('/v1/ai/favorites')
      .set('Authorization', `Bearer ${token}`)
      .send({
        query: 'vendas do mes',
        category: 'SALES',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('favorite');
    expect(response.body.favorite).toHaveProperty('id');
    expect(response.body.favorite.query).toBe('vendas do mes');
    expect(response.body.favorite.category).toBe('SALES');
    expect(response.body.favorite).toHaveProperty('tenantId');
    expect(response.body.favorite).toHaveProperty('userId');
    expect(response.body.favorite).toHaveProperty('usageCount');
    expect(response.body.favorite).toHaveProperty('createdAt');
  });

  it('GET /v1/ai/favorites — should list favorites', async () => {
    // Create a favorite first to ensure there is at least one
    await request(app.server)
      .post('/v1/ai/favorites')
      .set('Authorization', `Bearer ${token}`)
      .send({
        query: 'produtos em estoque',
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

  it('GET /v1/ai/favorites — should filter by category', async () => {
    const response = await request(app.server)
      .get('/v1/ai/favorites')
      .query({ category: 'SALES' })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('favorites');
    for (const favorite of response.body.favorites) {
      expect(favorite.category).toBe('SALES');
    }
  });

  it('DELETE /v1/ai/favorites/:id — should delete a favorite', async () => {
    // Create a favorite to delete
    const createResponse = await request(app.server)
      .post('/v1/ai/favorites')
      .set('Authorization', `Bearer ${token}`)
      .send({
        query: 'favorito para deletar',
        category: 'GENERAL',
      });

    const favoriteId = createResponse.body.favorite.id;

    const response = await request(app.server)
      .delete(`/v1/ai/favorites/${favoriteId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success');
    expect(response.body.success).toBe(true);

    // Verify it is gone by listing with a high enough limit
    const listResponse = await request(app.server)
      .get('/v1/ai/favorites')
      .set('Authorization', `Bearer ${token}`);

    const ids = listResponse.body.favorites.map((f: { id: string }) => f.id);
    expect(ids).not.toContain(favoriteId);
  });
});

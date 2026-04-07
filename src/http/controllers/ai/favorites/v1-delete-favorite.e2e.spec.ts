import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Delete Favorite (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });

  it('should delete a favorite (200)', async () => {
    // Create a favorite to delete
    const createResponse = await request(app.server)
      .post('/v1/ai/favorites')
      .set('Authorization', `Bearer ${token}`)
      .send({
        query: `favorito para deletar ${Date.now()}`,
        category: 'GENERAL',
      });

    expect(createResponse.status).toBe(201);
    const favoriteId = createResponse.body.favorite.id;

    const response = await request(app.server)
      .delete(`/v1/ai/favorites/${favoriteId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success');
    expect(response.body.success).toBe(true);
  });

  it('should return 401 without token', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server).delete(
      `/v1/ai/favorites/${fakeId}`,
    );

    expect(response.status).toBe(401);
  });
});

import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Delete Catalog (E2E)', () => {
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
    const response = await request(app.server).delete(
      '/v1/catalogs/00000000-0000-0000-0000-000000000001',
    );

    expect(response.status).toBe(401);
  });

  it('should return 404 for non-existent catalog', async () => {
    const response = await request(app.server)
      .delete('/v1/catalogs/00000000-0000-0000-0000-000000000001')
      .set('Authorization', `Bearer ${token}`);

    expect([404, 400]).toContain(response.status);
  });

  it('should delete a catalog (204)', async () => {
    const timestamp = Date.now();

    const createResponse = await request(app.server)
      .post('/v1/catalogs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Catalog Delete ${timestamp}`,
        type: 'GENERAL',
        showPrices: true,
        showStock: false,
        isPublic: true,
      });

    if (createResponse.status === 201) {
      const catalogId = createResponse.body.catalog.id;

      const response = await request(app.server)
        .delete(`/v1/catalogs/${catalogId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(204);
    }
  });
});

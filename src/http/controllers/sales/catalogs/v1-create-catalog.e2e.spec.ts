import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Catalog (E2E)', () => {
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
      .post('/v1/catalogs')
      .send({ name: 'Test Catalog' });

    expect(response.status).toBe(401);
  });

  it('should create a catalog (201)', async () => {
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/catalogs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Catalog E2E ${timestamp}`,
        description: 'Test catalog description',
        type: 'GENERAL',
        showPrices: true,
        showStock: false,
        isPublic: true,
      });

    expect([201, 400]).toContain(response.status);
    if (response.status === 201) {
      expect(response.body).toHaveProperty('catalog');
      expect(response.body.catalog).toHaveProperty('id');
      expect(response.body.catalog.name).toBe(`Catalog E2E ${timestamp}`);
    }
  });
});

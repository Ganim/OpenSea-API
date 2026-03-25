import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Catalogs (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /v1/catalogs should create a catalog (201)', async () => {
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/catalogs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Catalog ${timestamp}`,
        type: 'GENERAL',
        layout: 'GRID',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('catalog');
    expect(response.body.catalog).toHaveProperty('id');
    expect(response.body.catalog.name).toBe(`Catalog ${timestamp}`);
    expect(response.body.catalog.type).toBe('GENERAL');
  });

  it('GET /v1/catalogs should list catalogs (200)', async () => {
    const response = await request(app.server)
      .get('/v1/catalogs')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('GET /v1/catalogs/:id should get catalog by id (200)', async () => {
    const createResponse = await request(app.server)
      .post('/v1/catalogs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Catalog GetById ${Date.now()}`,
      });

    const catalogId = createResponse.body.catalog.id;

    const response = await request(app.server)
      .get(`/v1/catalogs/${catalogId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('catalog');
    expect(response.body.catalog.id).toBe(catalogId);
  });

  it('PUT /v1/catalogs/:id should update a catalog (200)', async () => {
    const createResponse = await request(app.server)
      .post('/v1/catalogs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Catalog Update ${Date.now()}`,
      });

    const catalogId = createResponse.body.catalog.id;

    const response = await request(app.server)
      .put(`/v1/catalogs/${catalogId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Catalog Name',
        layout: 'LIST',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('catalog');
    expect(response.body.catalog.name).toBe('Updated Catalog Name');
  });

  it('DELETE /v1/catalogs/:id should delete a catalog (204)', async () => {
    const createResponse = await request(app.server)
      .post('/v1/catalogs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Catalog Delete ${Date.now()}`,
      });

    const catalogId = createResponse.body.catalog.id;

    const response = await request(app.server)
      .delete(`/v1/catalogs/${catalogId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });
});

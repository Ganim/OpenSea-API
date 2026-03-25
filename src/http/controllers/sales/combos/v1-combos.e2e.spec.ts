import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Combos (E2E)', () => {
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

  it('POST /v1/combos should create a combo (201)', async () => {
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/combos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Combo ${timestamp}`,
        type: 'FIXED',
        fixedPrice: 99.9,
        isActive: true,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('combo');
    expect(response.body.combo).toHaveProperty('id');
    expect(response.body.combo.name).toBe(`Combo ${timestamp}`);
    expect(response.body.combo.type).toBe('FIXED');
  });

  it('GET /v1/combos should list combos (200)', async () => {
    const response = await request(app.server)
      .get('/v1/combos')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('combos');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.combos)).toBe(true);
  });

  it('GET /v1/combos/:id should get combo by id (200)', async () => {
    const createResponse = await request(app.server)
      .post('/v1/combos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Combo GetById ${Date.now()}`,
        type: 'DYNAMIC',
        discountType: 'PERCENTAGE',
        discountValue: 10,
      });

    const comboId = createResponse.body.combo.id;

    const response = await request(app.server)
      .get(`/v1/combos/${comboId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('combo');
    expect(response.body.combo.id).toBe(comboId);
  });

  it('DELETE /v1/combos/:id should soft delete a combo (204)', async () => {
    const createResponse = await request(app.server)
      .post('/v1/combos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Combo Delete ${Date.now()}`,
      });

    const comboId = createResponse.body.combo.id;

    const response = await request(app.server)
      .delete(`/v1/combos/${comboId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });
});

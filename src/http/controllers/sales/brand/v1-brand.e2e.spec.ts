import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Brand (E2E)', () => {
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

  it('GET /v1/brand should return tenant brand (200)', async () => {
    const response = await request(app.server)
      .get('/v1/brand')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('brand');
    expect(response.body.brand).toHaveProperty('id');
    expect(response.body.brand).toHaveProperty('tenantId');
    expect(response.body.brand).toHaveProperty('primaryColor');
  });

  it('PUT /v1/brand should update brand settings (200)', async () => {
    const response = await request(app.server)
      .put('/v1/brand')
      .set('Authorization', `Bearer ${token}`)
      .send({
        primaryColor: '#FF5733',
        tagline: 'Test tagline for E2E',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('brand');
    expect(response.body.brand.primaryColor).toBe('#FF5733');
    expect(response.body.brand.tagline).toBe('Test tagline for E2E');
  });
});

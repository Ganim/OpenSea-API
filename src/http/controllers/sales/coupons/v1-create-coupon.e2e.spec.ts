import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Coupon (E2E)', () => {
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
      .post('/v1/coupons')
      .send({ code: 'TEST10' });

    expect(response.status).toBe(401);
  });

  it('should create a coupon (201)', async () => {
    const response = await request(app.server)
      .post('/v1/coupons')
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: `CPN${Date.now()}`,
        type: 'PERCENTAGE',
        value: 15,
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
      });

    expect(response.status).toBe(201);
    expect(response.body.coupon).toBeDefined();
    expect(response.body.coupon).toHaveProperty('id');
  });

  it('should return 400 with missing required fields', async () => {
    const response = await request(app.server)
      .post('/v1/coupons')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: '' });

    expect(response.status).toBe(400);
  });
});

import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Coupons (E2E)', () => {
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

  it('POST /v1/coupons should create a coupon (201)', async () => {
    const timestamp = Date.now();
    const couponCode = `COUPON${timestamp}`;

    const response = await request(app.server)
      .post('/v1/coupons')
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: couponCode,
        type: 'PERCENTAGE',
        value: 15,
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 86400000 * 30).toISOString(),
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('coupon');
    expect(response.body.coupon).toHaveProperty('id');
    expect(response.body.coupon.code).toBe(couponCode);
    expect(response.body.coupon.type).toBe('PERCENTAGE');
    expect(response.body.coupon.value).toBe(15);
  });

  it('GET /v1/coupons should list coupons (200)', async () => {
    const response = await request(app.server)
      .get('/v1/coupons')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('coupons');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.coupons)).toBe(true);
  });

  it('DELETE /v1/coupons/:id should delete a coupon (204)', async () => {
    const couponCode = `DEL${Date.now()}`;

    const createResponse = await request(app.server)
      .post('/v1/coupons')
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: couponCode,
        type: 'FIXED_VALUE',
        value: 25,
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 86400000 * 30).toISOString(),
      });

    const couponId = createResponse.body.coupon.id;

    const response = await request(app.server)
      .delete(`/v1/coupons/${couponId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });
});

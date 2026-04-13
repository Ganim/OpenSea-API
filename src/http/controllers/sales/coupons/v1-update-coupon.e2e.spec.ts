import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Update Coupon (E2E)', () => {
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
      .put('/v1/coupons/00000000-0000-0000-0000-000000000001')
      .send({ value: 20 });

    expect(response.status).toBe(401);
  });

  it('should update a coupon (200)', async () => {
    const createRes = await request(app.server)
      .post('/v1/coupons')
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: `CPNUPD${Date.now()}`,
        type: 'FIXED_VALUE',
        value: 5,
        validFrom: new Date().toISOString(),
        validUntil: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      });

    const couponId = createRes.body.coupon.id;

    const response = await request(app.server)
      .put(`/v1/coupons/${couponId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ value: 20 });

    expect(response.status).toBe(200);
    expect(response.body.coupon).toBeDefined();
  });
});

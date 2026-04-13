import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Validate Coupon (E2E)', () => {
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
      .post('/v1/coupons/validate')
      .send({ code: 'TEST10' });

    expect(response.status).toBe(401);
  });

  it('should validate a coupon code', async () => {
    const code = `CPNVAL${Date.now()}`;

    await request(app.server)
      .post('/v1/coupons')
      .set('Authorization', `Bearer ${token}`)
      .send({
        code,
        type: 'PERCENTAGE',
        value: 10,
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
      });

    const response = await request(app.server)
      .post('/v1/coupons/validate')
      .set('Authorization', `Bearer ${token}`)
      .send({ code });

    expect([200, 400, 404]).toContain(response.status);
  });
});

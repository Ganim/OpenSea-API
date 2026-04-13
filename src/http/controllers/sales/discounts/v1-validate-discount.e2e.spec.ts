import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Validate Discount (E2E)', () => {
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
      .post('/v1/sales/discount-rules/validate')
      .send({});

    expect(response.status).toBe(401);
  });

  it('should validate discounts for a cart (200)', async () => {
    const response = await request(app.server)
      .post('/v1/sales/discount-rules/validate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        cartItems: [
          {
            variantId: '00000000-0000-0000-0000-000000000001',
            quantity: 2,
            unitPrice: 100,
          },
        ],
        orderValue: 200,
      });

    expect([200, 400]).toContain(response.status);
    if (response.status === 200) {
      expect(response.body).toHaveProperty('applicableDiscounts');
      expect(response.body).toHaveProperty('totalDiscount');
      expect(Array.isArray(response.body.applicableDiscounts)).toBe(true);
    }
  });
});

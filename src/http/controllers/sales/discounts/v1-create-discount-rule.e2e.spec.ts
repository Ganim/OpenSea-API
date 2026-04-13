import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Discount Rule (E2E)', () => {
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
      .post('/v1/sales/discount-rules')
      .send({ name: 'Test Discount' });

    expect(response.status).toBe(401);
  });

  it('should create a discount rule (201)', async () => {
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/sales/discount-rules')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Discount Rule ${timestamp}`,
        type: 'PERCENTAGE',
        value: 10,
        minOrderValue: 500,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000 * 90).toISOString(),
        isActive: true,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('discountRule');
    expect(response.body.discountRule).toHaveProperty('id');
    expect(response.body.discountRule.name).toBe(`Discount Rule ${timestamp}`);
    expect(response.body.discountRule.type).toBe('PERCENTAGE');
  });
});

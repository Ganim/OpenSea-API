import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Discount Rules (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });


  it('POST /v1/sales/discount-rules should create a discount rule (201)', async () => {
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

  it('GET /v1/sales/discount-rules should list discount rules (200)', async () => {
    const response = await request(app.server)
      .get('/v1/sales/discount-rules')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('discountRules');
    expect(response.body).toHaveProperty('total');
    expect(Array.isArray(response.body.discountRules)).toBe(true);
  });

  it('GET /v1/sales/discount-rules/:id should get discount rule by id (200)', async () => {
    const createResponse = await request(app.server)
      .post('/v1/sales/discount-rules')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Discount GetById ${Date.now()}`,
        type: 'FIXED_AMOUNT',
        value: 25,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000 * 30).toISOString(),
      });

    const discountRuleId = createResponse.body.discountRule.id;

    const response = await request(app.server)
      .get(`/v1/sales/discount-rules/${discountRuleId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('discountRule');
    expect(response.body.discountRule.id).toBe(discountRuleId);
  });

  it('DELETE /v1/sales/discount-rules/:id should soft delete a discount rule (204)', async () => {
    const createResponse = await request(app.server)
      .post('/v1/sales/discount-rules')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Discount Delete ${Date.now()}`,
        type: 'PERCENTAGE',
        value: 5,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000 * 30).toISOString(),
      });

    const discountRuleId = createResponse.body.discountRule.id;

    const response = await request(app.server)
      .delete(`/v1/sales/discount-rules/${discountRuleId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });
});

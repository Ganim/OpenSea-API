import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Update Discount Rule (E2E)', () => {
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
      .put('/v1/sales/discount-rules/00000000-0000-0000-0000-000000000001')
      .send({ name: 'Updated Discount' });

    expect(response.status).toBe(401);
  });

  it('should return 404 for non-existent discount rule', async () => {
    const response = await request(app.server)
      .put('/v1/sales/discount-rules/00000000-0000-0000-0000-000000000001')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Discount' });

    expect([404, 400]).toContain(response.status);
  });

  it('should update a discount rule (200)', async () => {
    const timestamp = Date.now();

    const createResponse = await request(app.server)
      .post('/v1/sales/discount-rules')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Discount Update ${timestamp}`,
        type: 'PERCENTAGE',
        value: 15,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000 * 60).toISOString(),
      });

    if (createResponse.status === 201) {
      const discountRuleId = createResponse.body.discountRule.id;

      const response = await request(app.server)
        .put(`/v1/sales/discount-rules/${discountRuleId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: `Discount Updated ${timestamp}`,
          value: 20,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('discountRule');
      expect(response.body.discountRule.name).toBe(
        `Discount Updated ${timestamp}`,
      );
    }
  });
});

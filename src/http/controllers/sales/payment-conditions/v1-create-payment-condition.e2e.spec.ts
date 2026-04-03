import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Payment Condition (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should create a payment condition', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/payment-conditions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Condition ${timestamp}`,
        type: 'CASH',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('paymentCondition');
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/payment-conditions')
      .send({ name: 'No Auth', type: 'CASH' });

    expect(response.status).toBe(401);
  });
});

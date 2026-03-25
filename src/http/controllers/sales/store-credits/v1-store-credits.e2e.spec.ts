import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Store Credits (E2E)', () => {
  let tenantId: string;
  let token: string;
  let customerId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;

    // Create a customer (required for store credits)
    const timestamp = Date.now();
    const customerResponse = await request(app.server)
      .post('/v1/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Store Credit Customer ${timestamp}`,
        type: 'INDIVIDUAL',
        email: `store-credit-${timestamp}@example.com`,
      });
    customerId = customerResponse.body.customer.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /v1/store-credits should create a manual store credit (201)', async () => {
    const response = await request(app.server)
      .post('/v1/store-credits')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId,
        amount: 150.0,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('storeCredit');
    expect(response.body.storeCredit).toHaveProperty('id');
    expect(response.body.storeCredit.customerId).toBe(customerId);
    expect(response.body.storeCredit.amount).toBe(150.0);
    expect(response.body.storeCredit.source).toBe('MANUAL');
    expect(response.body.storeCredit.isActive).toBe(true);
  });

  it('GET /v1/store-credits/balance should return customer balance (200)', async () => {
    const response = await request(app.server)
      .get('/v1/store-credits/balance')
      .query({ customerId })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('balance');
    expect(typeof response.body.balance).toBe('number');
  });
});

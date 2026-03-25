import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Store Credits (E2E)', () => {
  let tenantId: string;
  let token: string;
  let customerId: string;
  let storeCreditId: string;

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

    storeCreditId = response.body.storeCredit.id;
  });

  it('GET /v1/store-credits should list store credits (200)', async () => {
    const response = await request(app.server)
      .get('/v1/store-credits')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('storeCredits');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.storeCredits)).toBe(true);
    expect(response.body.storeCredits.length).toBeGreaterThanOrEqual(1);
    expect(response.body.meta).toHaveProperty('total');
    expect(response.body.meta).toHaveProperty('page');
    expect(response.body.meta).toHaveProperty('limit');
    expect(response.body.meta).toHaveProperty('pages');
  });

  it('GET /v1/store-credits should filter by customerId (200)', async () => {
    const response = await request(app.server)
      .get('/v1/store-credits')
      .query({ customerId })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.storeCredits.length).toBeGreaterThanOrEqual(1);
    for (const credit of response.body.storeCredits) {
      expect(credit.customerId).toBe(customerId);
    }
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

  it('GET /v1/store-credits/:storeCreditId should return the store credit (200)', async () => {
    const response = await request(app.server)
      .get(`/v1/store-credits/${storeCreditId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('storeCredit');
    expect(response.body.storeCredit.id).toBe(storeCreditId);
    expect(response.body.storeCredit.customerId).toBe(customerId);
    expect(response.body.storeCredit.amount).toBe(150.0);
    expect(response.body.storeCredit.source).toBe('MANUAL');
  });

  it('GET /v1/store-credits/:storeCreditId should return 404 for non-existing credit', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const response = await request(app.server)
      .get(`/v1/store-credits/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
  });

  it('DELETE /v1/store-credits/:storeCreditId should delete the store credit (204)', async () => {
    // Create a separate credit to delete
    const createResponse = await request(app.server)
      .post('/v1/store-credits')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId,
        amount: 50.0,
      });

    const creditToDeleteId = createResponse.body.storeCredit.id;

    const response = await request(app.server)
      .delete(`/v1/store-credits/${creditToDeleteId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);

    // Verify it was actually deleted
    const getResponse = await request(app.server)
      .get(`/v1/store-credits/${creditToDeleteId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(getResponse.status).toBe(404);
  });

  it('DELETE /v1/store-credits/:storeCreditId should return 404 for non-existing credit', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const response = await request(app.server)
      .delete(`/v1/store-credits/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
  });
});

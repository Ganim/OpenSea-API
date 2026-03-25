import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Payment Conditions (E2E)', () => {
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

  it('POST /v1/payment-conditions should create a payment condition (201)', async () => {
    const response = await request(app.server)
      .post('/v1/payment-conditions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Net 30 Days',
        type: 'INSTALLMENT',
        installments: 1,
        firstDueDays: 30,
        intervalDays: 0,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('paymentCondition');
    expect(response.body.paymentCondition).toHaveProperty('id');
    expect(response.body.paymentCondition.name).toBe('Net 30 Days');
    expect(response.body.paymentCondition.type).toBe('INSTALLMENT');
  });

  it('GET /v1/payment-conditions should list payment conditions (200)', async () => {
    const response = await request(app.server)
      .get('/v1/payment-conditions')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('PUT /v1/payment-conditions/:id should update a payment condition (200)', async () => {
    const createResponse = await request(app.server)
      .post('/v1/payment-conditions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Cash Payment',
        type: 'CASH',
      });

    const paymentConditionId = createResponse.body.paymentCondition.id;

    const response = await request(app.server)
      .put(`/v1/payment-conditions/${paymentConditionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Cash Payment - Updated',
        isDefault: true,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('paymentCondition');
    expect(response.body.paymentCondition.name).toBe('Cash Payment - Updated');
  });

  it('DELETE /v1/payment-conditions/:id should delete a payment condition (204)', async () => {
    const createResponse = await request(app.server)
      .post('/v1/payment-conditions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Temporary Condition To Delete',
        type: 'CUSTOM',
      });

    const paymentConditionId = createResponse.body.paymentCondition.id;

    const response = await request(app.server)
      .delete(`/v1/payment-conditions/${paymentConditionId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });
});

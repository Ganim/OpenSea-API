import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Orders E2E (Orders, Payment Conditions)', () => {
  let token: string;
  let customerId: string;
  let pipelineId: string;
  let stageId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId } = await createAndSetupTenant();

    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;

    // Create a customer for orders
    const timestamp = Date.now();
    const customerRes = await request(app.server)
      .post('/v1/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Order Customer ${timestamp}`,
        type: 'BUSINESS',
        email: `order-customer-${timestamp}@example.com`,
      });

    customerId = customerRes.body.customer.id;

    // Create a pipeline and stage for orders
    const pipelineRes = await request(app.server)
      .post('/v1/pipelines')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Order Pipeline ${timestamp}`,
        type: 'SALES',
      });

    pipelineId = pipelineRes.body.pipeline.id;

    const stageRes = await request(app.server)
      .post(`/v1/pipelines/${pipelineId}/stages`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'New',
        type: 'OPEN',
        position: 1,
      });

    stageId = stageRes.body.stage.id;
  });


  // ── Orders ──────────────────────────────────────────────────────────────────

  it('POST /v1/orders should create an order (201)', async () => {
    const response = await request(app.server)
      .post('/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'ORDER',
        customerId,
        pipelineId,
        stageId,
        channel: 'MANUAL',
        subtotal: 100,
        items: [
          {
            name: 'Test Product',
            quantity: 2,
            unitPrice: 50,
          },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('order');
    expect(response.body).toHaveProperty('items');
    expect(response.body.order).toHaveProperty('id');
    expect(response.body.order.customerId).toBe(customerId);
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.items.length).toBe(1);
  });

  it('GET /v1/orders should list orders (200)', async () => {
    const response = await request(app.server)
      .get('/v1/orders')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.meta).toHaveProperty('total');
    expect(response.body.meta).toHaveProperty('page');
  });

  // ── Payment Conditions ──────────────────────────────────────────────────────

  it('POST /v1/payment-conditions should create a payment condition (201)', async () => {
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/payment-conditions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Payment ${timestamp}`,
        type: 'CASH',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('paymentCondition');
    expect(response.body.paymentCondition).toHaveProperty('id');
    expect(response.body.paymentCondition.name).toContain('Payment');
    expect(response.body.paymentCondition.type).toBe('CASH');
  });

  it('GET /v1/payment-conditions should list payment conditions (200)', async () => {
    const response = await request(app.server)
      .get('/v1/payment-conditions')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.meta).toHaveProperty('total');
  });
});

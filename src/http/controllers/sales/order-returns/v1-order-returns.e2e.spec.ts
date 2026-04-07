import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Order Returns (E2E)', () => {
  let tenantId: string;
  let token: string;
  let orderId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;

    const timestamp = Date.now();

    // Create a customer
    const customerResponse = await request(app.server)
      .post('/v1/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Return Test Customer ${timestamp}`,
        type: 'INDIVIDUAL',
        email: `return-customer-${timestamp}@example.com`,
      });
    const customerId = customerResponse.body.customer.id;

    // Create a pipeline
    const pipelineResponse = await request(app.server)
      .post('/v1/pipelines')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Return Test Pipeline ${timestamp}`,
        type: 'SALES',
      });
    const pipelineId = pipelineResponse.body.pipeline.id;

    // Create a stage
    const stageResponse = await request(app.server)
      .post(`/v1/pipelines/${pipelineId}/stages`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'New',
        type: 'OPEN',
        position: 0,
      });
    const stageId = stageResponse.body.stage.id;

    // Create an order (required for returns)
    const orderResponse = await request(app.server)
      .post('/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'ORDER',
        customerId,
        pipelineId,
        stageId,
        channel: 'MANUAL',
        subtotal: 500,
        items: [
          {
            name: 'Test Product A',
            quantity: 2,
            unitPrice: 250,
          },
        ],
      });
    orderId = orderResponse.body.order.id;
  });

  it('POST /v1/returns should create a return request (201)', async () => {
    const response = await request(app.server)
      .post('/v1/returns')
      .set('Authorization', `Bearer ${token}`)
      .send({
        orderId,
        type: 'FULL_RETURN',
        reason: 'DEFECTIVE',
        reasonDetails: 'Product arrived with visible damage on packaging',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('orderReturn');
    expect(response.body.orderReturn).toHaveProperty('id');
    expect(response.body.orderReturn.orderId).toBe(orderId);
    expect(response.body.orderReturn.type).toBe('FULL_RETURN');
    expect(response.body.orderReturn.reason).toBe('DEFECTIVE');
  });

  it('GET /v1/returns should list returns (200)', async () => {
    const response = await request(app.server)
      .get('/v1/returns')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('PATCH /v1/returns/:id/approve should approve a return (200)', async () => {
    // Create a return to approve
    const createResponse = await request(app.server)
      .post('/v1/returns')
      .set('Authorization', `Bearer ${token}`)
      .send({
        orderId,
        type: 'PARTIAL_RETURN',
        reason: 'WRONG_ITEM',
      });

    const returnId = createResponse.body.orderReturn.id;

    const response = await request(app.server)
      .patch(`/v1/returns/${returnId}/approve`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('orderReturn');
    expect(response.body.orderReturn.id).toBe(returnId);
  });
});

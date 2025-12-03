import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Cancel Sales Order (E2E)', () => {
  let userToken: string;
  let customerId: string;
  let variantId: string;

  beforeAll(async () => {
    await app.ready();

    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    userToken = token;

    // Create dependencies
    const timestamp = Date.now();

    const customerResponse = await request(app.server)
      .post('/v1/customers')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: `Test Customer ${timestamp}`,
        type: 'INDIVIDUAL',
      });
    customerId = customerResponse.body.customer.id;

    // Create template, product and variant for tests
    const templateResponse = await request(app.server)
      .post('/v1/templates')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: `Test Template CANCEL-${timestamp}`,
        productAttributes: { test: 'value' },
      });
    const templateId = templateResponse.body.template.id;

    const productResponse = await request(app.server)
      .post('/v1/products')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: `Test Product ${timestamp}`,
        code: `PROD-CANCEL-${timestamp}`,
        templateId,
      });
    if (!productResponse.body || !productResponse.body.product) {
      console.error('Product Response:', {
        status: productResponse.status,
        body: productResponse.body,
      });
      throw new Error('Failed to create product');
    }

    const productId = productResponse.body.product.id;

    const variantResponse = await request(app.server)
      .post('/v1/variants')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        productId,
        name: `Test Variant ${timestamp}`,
        sku: `SKU-${timestamp}`,
        price: 100,
        stockQuantity: 50,
      });
    variantId = variantResponse.body.variant.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to cancel a DRAFT order', async () => {
    const timestamp = Date.now();

    const createResponse = await request(app.server)
      .post('/v1/sales-orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        orderNumber: `SO-CANCEL-1-${timestamp}`,
        customerId,
        status: 'DRAFT',
        totalPrice: 100,
        items: [{ variantId, quantity: 1, unitPrice: 100, totalPrice: 100 }],
      });

    const salesOrderId = createResponse.body.salesOrder.id;

    const response = await request(app.server)
      .patch(`/v1/sales-orders/${salesOrderId}/cancel`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Sales order cancelled successfully.');
  });

  it('should be able to cancel a PENDING order', async () => {
    const timestamp = Date.now();

    const createResponse = await request(app.server)
      .post('/v1/sales-orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        orderNumber: `SO-CANCEL-2-${timestamp}`,
        customerId,
        status: 'PENDING',
        totalPrice: 100,
        items: [{ variantId, quantity: 1, unitPrice: 100, totalPrice: 100 }],
      });

    const salesOrderId = createResponse.body.salesOrder.id;

    const response = await request(app.server)
      .patch(`/v1/sales-orders/${salesOrderId}/cancel`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Sales order cancelled successfully.');
  });

  it('should not be able to cancel a DELIVERED order', async () => {
    const timestamp = Date.now();

    const createResponse = await request(app.server)
      .post('/v1/sales-orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        orderNumber: `SO-CANCEL-3-${timestamp}`,
        customerId,
        status: 'DRAFT',
        totalPrice: 100,
        items: [{ variantId, quantity: 1, unitPrice: 100, totalPrice: 100 }],
      });

    const salesOrderId = createResponse.body.salesOrder.id;

    // Update through valid transitions: DRAFT → PENDING → CONFIRMED → IN_TRANSIT → DELIVERED
    await request(app.server)
      .patch(`/v1/sales-orders/${salesOrderId}/status`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ status: 'PENDING' });

    await request(app.server)
      .patch(`/v1/sales-orders/${salesOrderId}/status`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ status: 'CONFIRMED' });

    await request(app.server)
      .patch(`/v1/sales-orders/${salesOrderId}/status`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ status: 'IN_TRANSIT' });

    const updateResponse = await request(app.server)
      .patch(`/v1/sales-orders/${salesOrderId}/status`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ status: 'DELIVERED' });

    // Verify it was updated to DELIVERED
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.salesOrder.status).toBe('DELIVERED');

    const response = await request(app.server)
      .patch(`/v1/sales-orders/${salesOrderId}/cancel`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(400);
  });

  it('should not be able to cancel without authentication', async () => {
    // Using valid UUID to pass schema validation, then test auth
    const validUUID = '00000000-0000-0000-0000-000000000000';
    const response = await request(app.server).patch(
      `/v1/sales-orders/${validUUID}/cancel`,
    );

    // Schema validation with invalid UUID happens before auth check
    expect(response.status).toBe(401);
  });

  it('should not be able to cancel a non-existent order', async () => {
    // Using a valid UUID format that doesn't exist in database
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .patch(`/v1/sales-orders/${nonExistentId}/cancel`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(404);
  });
});

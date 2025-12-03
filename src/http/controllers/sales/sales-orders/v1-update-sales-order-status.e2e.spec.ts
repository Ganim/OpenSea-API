import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Update Sales Order Status (E2E)', () => {
  let userToken: string;
  let customerId: string;
  let variantId: string;

  beforeAll(async () => {
    await app.ready();

    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    userToken = token;

    const timestamp = Date.now();

    // Create customer
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
        name: `Test Template UPDATE-STATUS-${timestamp}`,
        productAttributes: { test: 'value' },
      });
    const templateId = templateResponse.body.template.id;

    const productResponse = await request(app.server)
      .post('/v1/products')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: `Test Product ${timestamp}`,
        code: `PROD-UPDATE-${timestamp}`,
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

  it('should be able to update status from DRAFT to PENDING', async () => {
    const timestamp = Date.now();

    const createResponse = await request(app.server)
      .post('/v1/sales-orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        orderNumber: `SO-STATUS-1-${timestamp}`,
        customerId,
        status: 'DRAFT',
        totalPrice: 100,
        items: [{ variantId, quantity: 1, unitPrice: 100, totalPrice: 100 }],
      });

    const salesOrderId = createResponse.body.salesOrder.id;

    const response = await request(app.server)
      .patch(`/v1/sales-orders/${salesOrderId}/status`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ status: 'PENDING' });

    expect(response.status).toBe(200);
    expect(response.body.salesOrder.status).toBe('PENDING');
  });

  it('should be able to update status from PENDING to CONFIRMED', async () => {
    const timestamp = Date.now();

    const createResponse = await request(app.server)
      .post('/v1/sales-orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        orderNumber: `SO-STATUS-2-${timestamp}`,
        customerId,
        status: 'PENDING',
        totalPrice: 100,
        items: [{ variantId, quantity: 1, unitPrice: 100, totalPrice: 100 }],
      });

    const salesOrderId = createResponse.body.salesOrder.id;

    const response = await request(app.server)
      .patch(`/v1/sales-orders/${salesOrderId}/status`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ status: 'CONFIRMED' });

    expect(response.status).toBe(200);
    expect(response.body.salesOrder.status).toBe('CONFIRMED');
  });

  it('should not be able to update status from final status', async () => {
    const timestamp = Date.now();

    // Create order with PENDING status
    const createResponse = await request(app.server)
      .post('/v1/sales-orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        orderNumber: `SO-STATUS-3-${timestamp}`,
        customerId,
        status: 'PENDING',
        totalPrice: 100,
        items: [{ variantId, quantity: 1, unitPrice: 100, totalPrice: 100 }],
      });

    const salesOrderId = createResponse.body.salesOrder.id;

    // Update to DELIVERED to make it final
    await request(app.server)
      .patch(`/v1/sales-orders/${salesOrderId}/status`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ status: 'CONFIRMED' });

    await request(app.server)
      .patch(`/v1/sales-orders/${salesOrderId}/status`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ status: 'IN_TRANSIT' });

    await request(app.server)
      .patch(`/v1/sales-orders/${salesOrderId}/status`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ status: 'DELIVERED' });

    // Try to update from DELIVERED (final status)
    const response = await request(app.server)
      .patch(`/v1/sales-orders/${salesOrderId}/status`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ status: 'PENDING' });

    expect(response.status).toBe(400);
  });

  it('should not be able to update status without authentication', async () => {
    // Using valid UUID to pass schema validation, then test auth
    const validUUID = '00000000-0000-0000-0000-000000000000';
    const response = await request(app.server)
      .patch(`/v1/sales-orders/${validUUID}/status`)
      .send({ status: 'PENDING' });

    expect(response.status).toBe(401);
  });

  it('should not be able to update status of non-existent order', async () => {
    // Using a valid UUID format that doesn't exist in database
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .patch(`/v1/sales-orders/${nonExistentId}/status`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ status: 'PENDING' });

    expect(response.status).toBe(404);
  });
});

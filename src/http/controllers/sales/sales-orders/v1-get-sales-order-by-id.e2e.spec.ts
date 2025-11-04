import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Get Sales Order By ID (E2E)', () => {
  let userToken: string;
  let salesOrderId: string;

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
    const customerId = customerResponse.body.customer.id;

    // Create template, product and variant for tests
    const templateResponse = await request(app.server)
      .post('/v1/templates')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: `Test Template GET-BY-ID-${timestamp}`,
        productAttributes: { test: 'value' },
      });
    const templateId = templateResponse.body.template.id;

    const productResponse = await request(app.server)
      .post('/v1/products')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: `Test Product ${timestamp}`,
        code: `PROD-GET-${timestamp}`,
        unitOfMeasure: 'UNITS',
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
    const variantId = variantResponse.body.variant.id;

    // Create sales order
    const salesOrderResponse = await request(app.server)
      .post('/v1/sales-orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        orderNumber: `SO-TEST-${timestamp}`,
        customerId,
        totalPrice: 100,
        items: [
          {
            variantId,
            quantity: 1,
            unitPrice: 100,
            totalPrice: 100,
          },
        ],
      });
    salesOrderId = salesOrderResponse.body.salesOrder.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to get a sales order by id', async () => {
    const response = await request(app.server)
      .get(`/v1/sales-orders/${salesOrderId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      salesOrder: {
        id: salesOrderId,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    });
    expect(response.body.salesOrder.items).toHaveLength(1);
  });

  it('should not be able to get a sales order without authentication', async () => {
    const response = await request(app.server).get(
      `/v1/sales-orders/${salesOrderId}`,
    );

    expect(response.status).toBe(401);
  });

  it('should not be able to get a non-existent sales order', async () => {
    // Using a valid UUID format that doesn't exist in database
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .get(`/v1/sales-orders/${nonExistentId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(404);
  });
});

import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Create Sales Order (E2E)', () => {
  let userToken: string;
  let customerId: string;
  let variantId: string;

  beforeAll(async () => {
    await app.ready();

    const { token } = await createAndAuthenticateUser(app);
    userToken = token;

    // Create a customer for tests
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
        name: `Test Template CREATE-${timestamp}`,
        productAttributes: { test: 'value' },
      });

    if (!templateResponse.body || !templateResponse.body.template) {
      console.error('Template Response:', {
        status: templateResponse.status,
        body: templateResponse.body,
      });
      throw new Error('Failed to create template');
    }

    const templateId = templateResponse.body.template.id;

    const productResponse = await request(app.server)
      .post('/v1/products')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: `Test Product ${timestamp}`,
        code: `PROD-CREATE-${timestamp}`,
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

  it('should be able to create a sales order with all fields', async () => {
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/sales-orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        orderNumber: `SO-${timestamp}`,
        customerId,
        status: 'DRAFT',
        totalPrice: 200, // 2 * 100
        discount: 10,
        notes: 'Test order',
        items: [
          {
            variantId,
            quantity: 2,
            unitPrice: 100,
            totalPrice: 200, // quantity * unitPrice
            discount: 5,
            notes: 'Item notes',
          },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      salesOrder: {
        id: expect.any(String),
        orderNumber: `SO-${timestamp}`,
        customerId,
        status: 'DRAFT',
        discount: 10,
        notes: 'Test order',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    });
    expect(response.body.salesOrder.items).toHaveLength(1);
    expect(response.body.salesOrder.items[0]).toMatchObject({
      variantId,
      quantity: 2,
      unitPrice: 100,
      discount: 5,
      notes: 'Item notes',
    });
  });

  it('should be able to create a sales order with minimal data', async () => {
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/sales-orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        orderNumber: `SO-MIN-${timestamp}`,
        customerId,
        totalPrice: 100, // 1 * 100
        items: [
          {
            variantId,
            quantity: 1,
            unitPrice: 100,
            totalPrice: 100, // quantity * unitPrice
          },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      salesOrder: {
        id: expect.any(String),
        orderNumber: `SO-MIN-${timestamp}`,
        customerId,
        status: 'PENDING', // Default status quando não fornecido
        discount: 0, // Default discount
      },
    });
    expect(response.body.salesOrder.items).toHaveLength(1);
  });

  it('should not be able to create a sales order without authentication', async () => {
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/sales-orders')
      .send({
        orderNumber: `SO-UNAUTH-${timestamp}`,
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

    expect(response.status).toBe(401);
  });

  it('should not be able to create a sales order with invalid customer', async () => {
    const response = await request(app.server)
      .post('/v1/sales-orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        orderNumber: `SO-INVALID-CUST-${Date.now()}`,
        customerId: randomUUID(),
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

    expect(response.status).toBe(404);
  });

  it('should not be able to create a sales order with invalid variant', async () => {
    const timestamp = Date.now();
    const nonExistentVariantId = randomUUID();

    const response = await request(app.server)
      .post('/v1/sales-orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        orderNumber: `SO-INVALID-VAR-${timestamp}`,
        customerId,
        totalPrice: 100,
        items: [
          {
            variantId: nonExistentVariantId,
            quantity: 1,
            unitPrice: 100,
            totalPrice: 100,
          },
        ],
      });

    expect(response.status).toBe(404);
  });
});

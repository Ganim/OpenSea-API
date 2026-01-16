import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Create Sales Order (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create sales order with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const timestamp = Date.now();

    // Create customer
    const customerResponse = await request(app.server)
      .post('/v1/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Test Customer ${timestamp}`,
        type: 'INDIVIDUAL',
      });
    const customerId = customerResponse.body.customer.id;

    // Create template, product and variant
    const templateResponse = await request(app.server)
      .post('/v1/templates')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Test Template CREATE-${timestamp}`,
        productAttributes: { test: 'value' },
      });
    const templateId = templateResponse.body.template.id;

    const productResponse = await request(app.server)
      .post('/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Test Product ${timestamp}`,
        code: `PROD-CREATE-${timestamp}`,
        templateId,
      });
    const productId = productResponse.body.product.id;

    const variantResponse = await request(app.server)
      .post('/v1/variants')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId,
        name: `Test Variant ${timestamp}`,
        sku: `SKU-CREATE-${timestamp}`,
        price: 100,
        stockQuantity: 50,
      });
    const variantId = variantResponse.body.variant.id;

    const response = await request(app.server)
      .post('/v1/sales-orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        orderNumber: `SO-${timestamp}`,
        customerId,
        status: 'DRAFT',
        totalPrice: 200,
        items: [
          {
            variantId,
            quantity: 2,
            unitPrice: 100,
            totalPrice: 200,
          },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('salesOrder');
    expect(response.body.salesOrder).toHaveProperty('id');
    expect(response.body.salesOrder).toHaveProperty('orderNumber');
    expect(response.body.salesOrder).toHaveProperty('items');
  });
});

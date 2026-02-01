import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Cancel Sales Order (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should cancel sales order with correct schema', async () => {
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
        name: `Test Template CANCEL-${timestamp}`,
        productAttributes: { test: { type: 'string', label: 'Test' } },
      });
    const templateId = templateResponse.body.template.id;

    const productResponse = await request(app.server)
      .post('/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Test Product ${timestamp}`,
        code: `PROD-CANCEL-${timestamp}`,
        templateId,
      });
    const productId = productResponse.body.product.id;

    const variantResponse = await request(app.server)
      .post('/v1/variants')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId,
        name: `Test Variant ${timestamp}`,
        sku: `SKU-CANCEL-${timestamp}`,
        price: 100,
        stockQuantity: 50,
      });
    const variantId = variantResponse.body.variant.id;

    // Create sales order
    const createResponse = await request(app.server)
      .post('/v1/sales-orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        orderNumber: `SO-CANCEL-${timestamp}`,
        customerId,
        status: 'DRAFT',
        totalPrice: 100,
        items: [{ variantId, quantity: 1, unitPrice: 100, totalPrice: 100 }],
      });
    const salesOrderId = createResponse.body.salesOrder.id;

    const response = await request(app.server)
      .patch(`/v1/sales-orders/${salesOrderId}/cancel`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message');
  });
});

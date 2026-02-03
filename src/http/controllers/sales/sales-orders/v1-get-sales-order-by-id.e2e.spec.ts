import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Get Sales Order By ID (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get sales order by id with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
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
        name: `Test Template GET-${timestamp}`,
        productAttributes: { test: { type: 'string', label: 'Test' } },
      });
    const templateId = templateResponse.body.template.id;

    const productResponse = await request(app.server)
      .post('/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Test Product ${timestamp}`,
        code: `PROD-GET-${timestamp}`,
        templateId,
      });
    const productId = productResponse.body.product.id;

    const variantResponse = await request(app.server)
      .post('/v1/variants')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId,
        name: `Test Variant ${timestamp}`,
        sku: `SKU-GET-${timestamp}`,
        price: 100,
        stockQuantity: 50,
      });
    const variantId = variantResponse.body.variant.id;

    // Create sales order
    const createResponse = await request(app.server)
      .post('/v1/sales-orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        orderNumber: `SO-TEST-${timestamp}`,
        customerId,
        totalPrice: 100,
        items: [{ variantId, quantity: 1, unitPrice: 100, totalPrice: 100 }],
      });
    const salesOrderId = createResponse.body.salesOrder.id;

    const response = await request(app.server)
      .get(`/v1/sales-orders/${salesOrderId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('salesOrder');
    expect(response.body.salesOrder).toHaveProperty('id', salesOrderId);
    expect(response.body.salesOrder).toHaveProperty('items');
  });
});

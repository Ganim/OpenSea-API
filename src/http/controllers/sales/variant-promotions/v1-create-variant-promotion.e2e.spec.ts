import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Create Variant Promotion (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create variant promotion with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const timestamp = Date.now();

    // Create template
    const templateResponse = await request(app.server)
      .post('/v1/templates')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Test Template PROMO-${timestamp}`,
        productAttributes: { test: { type: 'string', label: 'Test' } },
      });
    const templateId = templateResponse.body.template.id;

    // Create product
    const productResponse = await request(app.server)
      .post('/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Test Product ${timestamp}`,
        code: `PROD-PROMO-${timestamp}`,
        templateId,
      });
    const productId = productResponse.body.product.id;

    // Create variant
    const variantResponse = await request(app.server)
      .post('/v1/variants')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId,
        name: `Test Variant ${timestamp}`,
        sku: `SKU-PROMO-${timestamp}`,
        price: 100,
        stockQuantity: 50,
      });
    const variantId = variantResponse.body.variant.id;

    const startDate = new Date();
    const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const response = await request(app.server)
      .post('/v1/variant-promotions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        variantId,
        name: 'Summer Sale',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('promotion');
    expect(response.body.promotion).toHaveProperty('id');
    expect(response.body.promotion).toHaveProperty('variantId', variantId);
    expect(response.body.promotion).toHaveProperty('name', 'Summer Sale');
  });
});

import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Update Variant Promotion (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should update a variant promotion successfully', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const timestamp = Date.now();

    // Create template
    const templateResponse = await request(app.server)
      .post('/v1/templates')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Test Template UPD-PROMO-${timestamp}`,
        productAttributes: { test: { type: 'string', label: 'Test' } },
      });
    const templateId = templateResponse.body.template.id;

    // Create product
    const productResponse = await request(app.server)
      .post('/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Test Product ${timestamp}`,
        code: `PROD-UPD-PROMO-${timestamp}`,
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
        sku: `SKU-UPD-PROMO-${timestamp}`,
        price: 100,
        stockQuantity: 50,
      });
    const variantId = variantResponse.body.variant.id;

    // Create promotion
    const startDate = new Date();
    const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const createResponse = await request(app.server)
      .post('/v1/variant-promotions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        variantId,
        name: 'Original Promotion',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

    expect(createResponse.status).toBe(201);
    const promotionId = createResponse.body.promotion.id;

    // Update promotion
    const newEndDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const response = await request(app.server)
      .put(`/v1/variant-promotions/${promotionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Promotion',
        discountValue: 25,
        endDate: newEndDate.toISOString(),
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('promotion');
    expect(response.body.promotion).toHaveProperty('id', promotionId);
    expect(response.body.promotion).toHaveProperty('name', 'Updated Promotion');
    expect(response.body.promotion).toHaveProperty('discountValue', 25);
  });

  it('should return 404 for non-existent promotion', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .put('/v1/variant-promotions/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Promotion',
      });

    expect(response.status).toBe(404);
  });
});

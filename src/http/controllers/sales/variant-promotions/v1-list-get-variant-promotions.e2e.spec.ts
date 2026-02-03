import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('List and Get Variant Promotions (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list variant promotions with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    // Create template
    const templateResponse = await request(app.server)
      .post('/v1/templates')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Test Template LIST-PROMO-${timestamp}`,
        productAttributes: { test: { type: 'string', label: 'Test' } },
      });
    const templateId = templateResponse.body.template.id;

    // Create product
    const productResponse = await request(app.server)
      .post('/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Test Product ${timestamp}`,
        code: `PROD-LIST-PROMO-${timestamp}`,
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
        sku: `SKU-LIST-PROMO-${timestamp}`,
        price: 100,
        stockQuantity: 50,
      });
    const variantId = variantResponse.body.variant.id;

    // Create promotion
    const startDate = new Date();
    const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await request(app.server)
      .post('/v1/variant-promotions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        variantId,
        name: 'Test Promotion',
        discountType: 'PERCENTAGE',
        discountValue: 15,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

    const response = await request(app.server)
      .get('/v1/variant-promotions')
      .query({ variantId })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('promotions');
    expect(Array.isArray(response.body.promotions)).toBe(true);
  });
});

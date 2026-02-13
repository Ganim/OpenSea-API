import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Get Variant Promotion by ID (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get variant promotion by id', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    // Create template
    const templateResponse = await request(app.server)
      .post('/v1/templates')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Template GET-PROMO-${timestamp}`,
        productAttributes: { test: { type: 'string', label: 'Test' } },
      });
    const templateId = templateResponse.body.template.id;

    // Create product
    const productResponse = await request(app.server)
      .post('/v1/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Product GET-PROMO-${timestamp}`,
        code: `PROD-GET-PROMO-${timestamp}`,
        templateId,
      });
    const productId = productResponse.body.product.id;

    // Create variant
    const variantResponse = await request(app.server)
      .post('/v1/variants')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId,
        name: `Variant GET-PROMO-${timestamp}`,
        sku: `SKU-GET-PROMO-${timestamp}`,
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
        name: `Promo GET ${timestamp}`,
        discountType: 'PERCENTAGE',
        discountValue: 20,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

    const promotionId = createResponse.body.promotion.id;

    const response = await request(app.server)
      .get(`/v1/variant-promotions/${promotionId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('promotion');
    expect(response.body.promotion.id).toBe(promotionId);
    expect(response.body.promotion).toHaveProperty('variantId');
    expect(response.body.promotion).toHaveProperty('discountType');
  });

  it('should return 404 for non-existent promotion', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/variant-promotions/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).get(
      '/v1/variant-promotions/00000000-0000-0000-0000-000000000000',
    );

    expect(response.status).toBe(401);
  });
});

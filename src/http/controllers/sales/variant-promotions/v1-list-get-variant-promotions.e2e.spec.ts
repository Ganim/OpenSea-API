import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('List and Get Variant Promotions (E2E)', () => {
  let userToken: string;
  let variantId: string;
  let promotionId: string;

  beforeAll(async () => {
    await app.ready();

    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    userToken = token;

    // Create template, product and variant for testing using Prisma
    const { randomUUID } = await import('node:crypto');
    const unique = randomUUID();

    const template = await prisma.template.create({
      data: {
        name: `Template ${unique}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    const product = await prisma.product.create({
      data: {
        name: `Product ${unique}`,
        code: `PROD-${unique}`,
        templateId: template.id,
      },
    });

    const variant = await prisma.variant.create({
      data: {
        productId: product.id,
        sku: `SKU-${unique}`,
        name: `Variant ${unique}`,
        price: 100,
      },
    });

    variantId = variant.id;

    // Create promotions directly via Prisma to avoid API issues
    const startDate = new Date();
    const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const promotion = await prisma.variantPromotion.create({
      data: {
        variantId,
        name: 'Test Promotion',
        discountType: 'PERCENTAGE',
        discountValue: 25,
        startDate,
        endDate,
        isActive: true,
      },
    });

    // Create an inactive promotion for testing filters
    await prisma.variantPromotion.create({
      data: {
        variantId,
        name: 'Inactive Promotion',
        discountType: 'FIXED_AMOUNT',
        discountValue: 10,
        startDate,
        endDate,
        isActive: false,
      },
    });

    promotionId = promotion.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to get a promotion by id', async () => {
    const response = await request(app.server)
      .get(`/v1/variant-promotions/${promotionId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      promotion: {
        id: promotionId,
        variantId,
        name: 'Test Promotion',
        discountType: 'PERCENTAGE',
        discountValue: 25,
        isActive: true,
      },
    });
  });

  it('should return 404 when promotion does not exist', async () => {
    const fakeUuid = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .get(`/v1/variant-promotions/${fakeUuid}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(404);
  });

  it('should be able to list promotions by variant', async () => {
    const response = await request(app.server)
      .get(`/v1/variant-promotions?variantId=${variantId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.promotions).toHaveLength(2); // Both active and inactive
    expect(response.body.promotions[0].variantId).toBe(variantId);
    expect(response.body.promotions[1].variantId).toBe(variantId);
  });

  it('should be able to list only active promotions', async () => {
    const response = await request(app.server)
      .get(`/v1/variant-promotions`)
      .query({ variantId, activeOnly: 'true' }) // Use .query() instead of URL encoding
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.promotions).toHaveLength(1);
    expect(response.body.promotions[0].isActive).toBe(true);
  });

  it('should return empty array when no filters provided', async () => {
    const response = await request(app.server)
      .get('/v1/variant-promotions')
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.promotions).toEqual([]);
  });
});

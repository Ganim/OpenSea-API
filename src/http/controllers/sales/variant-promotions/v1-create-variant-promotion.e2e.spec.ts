import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Create Variant Promotion (E2E)', () => {
  let userToken: string;
  let variantId: string;

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
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to create a variant promotion', async () => {
    const startDate = new Date();
    const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    const response = await request(app.server)
      .post('/v1/variant-promotions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        variantId,
        name: 'Summer Sale',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      promotion: {
        id: expect.any(String),
        variantId,
        name: 'Summer Sale',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        isActive: true,
        createdAt: expect.any(String),
      },
    });
  });

  it('should not be able to create a promotion without authentication', async () => {
    const startDate = new Date();
    const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const response = await request(app.server)
      .post('/v1/variant-promotions')
      .send({
        variantId,
        name: 'Unauthorized Promotion',
        discountType: 'FIXED_AMOUNT',
        discountValue: 10,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

    expect(response.status).toBe(401);
  });

  it('should not be able to create a promotion with invalid dates', async () => {
    const startDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const endDate = new Date(); // End before start

    const response = await request(app.server)
      .post('/v1/variant-promotions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        variantId,
        name: 'Invalid Date Promotion',
        discountType: 'PERCENTAGE',
        discountValue: 15,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

    expect(response.status).toBe(400);
  });

  it('should not be able to create a promotion with percentage over 100', async () => {
    const startDate = new Date();
    const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const response = await request(app.server)
      .post('/v1/variant-promotions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        variantId,
        name: 'Invalid Percentage',
        discountType: 'PERCENTAGE',
        discountValue: 150,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

    expect(response.status).toBe(400);
  });

  it('should not be able to create a promotion with non-existent variant', async () => {
    const startDate = new Date();
    const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const fakeUuid = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .post('/v1/variant-promotions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        variantId: fakeUuid,
        name: 'Non-existent Variant',
        discountType: 'FIXED_AMOUNT',
        discountValue: 5,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

    expect(response.status).toBe(404);
  });
});

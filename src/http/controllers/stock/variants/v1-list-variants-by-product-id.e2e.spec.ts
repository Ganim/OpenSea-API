import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('List Variants by Product ID (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list variants by product id with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const timestamp = Date.now();

    const template = await prisma.template.create({
      data: {
        name: `List Variants By Product Template ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    const product = await prisma.product.create({
      data: {
        code: `PROD-LIST-BY-ID-${timestamp}`,
        name: `Product For List By ID ${timestamp}`,
        status: 'ACTIVE',
        templateId: template.id,
        attributes: {},
      },
    });

    await prisma.variant.create({
      data: {
        productId: product.id,
        sku: `SKU-LIST-BY-ID-${timestamp}`,
        name: `Variant List By ID ${timestamp}`,
        price: 99.99,
        attributes: {},
      },
    });

    const response = await request(app.server)
      .get(`/v1/products/${product.id}/variants`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('variants');
    expect(Array.isArray(response.body.variants)).toBe(true);
  });
});

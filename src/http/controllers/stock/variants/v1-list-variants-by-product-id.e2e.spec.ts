import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createProduct } from '@/utils/tests/factories/stock/create-product.e2e';
import { createVariant } from '@/utils/tests/factories/stock/create-variant.e2e';

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

    const { product } = await createProduct({
      name: `Product For List By ID ${timestamp}`,
      templateId: template.id,
    });

    await createVariant({
      productId: product.id,
      sku: `SKU-LIST-BY-ID-${timestamp}`,
      name: `Variant List By ID ${timestamp}`,
      price: 99.99,
    });

    const response = await request(app.server)
      .get(`/v1/products/${product.id}/variants`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('variants');
    expect(Array.isArray(response.body.variants)).toBe(true);
  });
});

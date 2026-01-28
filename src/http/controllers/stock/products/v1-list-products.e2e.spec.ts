import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('List Products (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list products with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const timestamp = Date.now();
    const suffix = String(timestamp).slice(-4);

    const template = await prisma.template.create({
      data: {
        name: `Template List Test ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    await prisma.product.create({
      data: {
        fullCode: `001.000.${suffix}`,
        slug: `product-to-list-${timestamp}`,
        barcode: `BCLST${suffix}`,
        eanCode: `EAN${suffix}LST00`,
        upcCode: `UPC${suffix}LST0`,
        name: 'Product to List',
        status: 'ACTIVE',
        templateId: template.id,
        attributes: {},
      },
    });

    const response = await request(app.server)
      .get('/v1/products')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('products');
    expect(Array.isArray(response.body.products)).toBe(true);
  });
});

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { makeTemplate } from '@/utils/tests/factories/stock/make-template';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('List Products (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow authenticated user to LIST all PRODUCTS', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');

    // Create a template first
    const timestamp = Date.now();
    const template = makeTemplate({
      name: `Template List Test ${timestamp}`,
    });
    await prisma.template.create({
      data: {
        id: template.id.toString(),
        name: template.name,
        productAttributes: template.productAttributes as object,
        variantAttributes: template.variantAttributes as object,
        itemAttributes: template.itemAttributes as object,
        createdAt: template.createdAt,
      },
    });

    // Create some products
    await prisma.product.createMany({
      data: [
        {
          code: `PROD-LIST-1-${timestamp}`,
          name: 'Product 1',
          status: 'ACTIVE',
          templateId: template.id.toString(),
          attributes: {},
        },
        {
          code: `PROD-LIST-2-${timestamp}`,
          name: 'Product 2',
          status: 'ACTIVE',
          templateId: template.id.toString(),
          attributes: {},
        },
      ],
    });

    const response = await request(app.server)
      .get('/v1/products')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body.products).toBeDefined();
    expect(Array.isArray(response.body.products)).toBe(true);
    expect(response.body.products.length).toBeGreaterThanOrEqual(2);
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server).get('/v1/products');

    expect(response.statusCode).toEqual(401);
  });
});

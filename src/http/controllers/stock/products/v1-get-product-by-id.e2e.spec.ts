import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { makeTemplate } from '@/utils/tests/factories/stock/make-template';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Get Product By ID (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow authenticated user to GET a PRODUCT by ID', async () => {
    const { token } = await createAndAuthenticateUser(app);

    // Create a template first
    const timestamp = Date.now();
    const template = makeTemplate({
      name: `Template Get Test ${timestamp}`,
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

    // Create a product
    const productCode = `PROD-GET-${timestamp}`;
    const product = await prisma.product.create({
      data: {
        code: productCode,
        name: 'Product to Get',
        status: 'ACTIVE',
        templateId: template.id.toString(),
        attributes: {},
      },
    });

    const response = await request(app.server)
      .get(`/v1/products/${product.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body.product).toBeDefined();
    expect(response.body.product.id).toBe(product.id);
    expect(response.body.product.name).toBe('Product to Get');
    expect(response.body.product.code).toBe(productCode);
  });

  it('should return 404 when product does not exist', async () => {
    const { token } = await createAndAuthenticateUser(app);

    // Use a valid UUID that doesn't exist
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .get(`/v1/products/${nonExistentId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server).get(
      '/v1/products/00000000-0000-0000-0000-000000000000',
    );

    expect(response.statusCode).toEqual(401);
  });
});

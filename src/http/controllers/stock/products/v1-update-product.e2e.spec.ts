import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Update Product (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to update a product as MANAGER', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const timestamp = Date.now();
    const templateDb = await prisma.template.create({
      data: {
        name: `Template UPDATE Test ${timestamp}`,
        productAttributes: {
          warranty: { type: 'string', required: false },
        },
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    const productDb = await prisma.product.create({
      data: {
        code: `PROD-UPDATE-${timestamp}`,
        name: `Old Product Name ${timestamp}`,
        status: 'ACTIVE',
        templateId: templateDb.id,
        attributes: { warranty: '12 months' },
      },
    });

    const response = await request(app.server)
      .put(`/v1/products/${productDb.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Updated Product Name ${timestamp}`,
        description: 'Updated description',
        status: 'INACTIVE',
        attributes: { warranty: '24 months' },
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('product');
    expect(response.body.product).toMatchObject({
      name: `Updated Product Name ${timestamp}`,
      status: 'INACTIVE',
    });
  });

  it('should return 404 when trying to update a non-existent product', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    // Use a valid UUID that doesn't exist
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .put(`/v1/products/${nonExistentId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Product',
      });

    expect(response.statusCode).toBe(404);
  });

  it('should return 403 when USER tries to update a product', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');

    const timestamp = Date.now();
    const templateDb = await prisma.template.create({
      data: {
        name: `Template Update Forbidden Test ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    const product = await prisma.product.create({
      data: {
        code: `PROD-UPDATE-FORBIDDEN-${timestamp}`,
        name: 'Product to Update',
        status: 'ACTIVE',
        templateId: templateDb.id,
        attributes: {},
      },
    });

    const response = await request(app.server)
      .put(`/v1/products/${product.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Product',
      });

    expect(response.statusCode).toBe(403);
  });

  it('should return 401 when no token is provided', async () => {
    const timestamp = Date.now();
    const templateDb = await prisma.template.create({
      data: {
        name: `Template Update 401 Test ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    const product = await prisma.product.create({
      data: {
        code: `PROD-UPDATE-401-${timestamp}`,
        name: 'Product for 401 Test',
        status: 'ACTIVE',
        templateId: templateDb.id,
        attributes: {},
      },
    });

    const response = await request(app.server)
      .put(`/v1/products/${product.id}`)
      .send({
        name: 'Updated Product',
      });

    expect(response.statusCode).toBe(401);
  });
});

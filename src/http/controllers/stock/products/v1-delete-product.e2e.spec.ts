import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { makeTemplate } from '@/utils/tests/factories/stock/make-template';

describe('Delete Product (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to delete a product as ADMIN', async () => {
    const { token } = await createAndAuthenticateUser(app, 'ADMIN');

    // Create a template first
    const timestamp = Date.now();
    const template = makeTemplate({
      name: `Template Delete Test ${timestamp}`,
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
    const product = await prisma.product.create({
      data: {
        code: `PROD-DELETE-${timestamp}`,
        name: 'Product to Delete',
        status: 'ACTIVE',
        unitOfMeasure: 'UNITS',
        templateId: template.id.toString(),
        attributes: {},
      },
    });

    const response = await request(app.server)
      .delete(`/v1/products/${product.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(204);
  });

  it('should return 404 when trying to delete a non-existent product', async () => {
    const { token } = await createAndAuthenticateUser(app, 'ADMIN');

    // Use a valid UUID that doesn't exist
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .delete(`/v1/products/${nonExistentId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
  });

  it('should return 403 when MANAGER tries to delete a product', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    // Create a template first
    const timestamp = Date.now();
    const template = makeTemplate({
      name: `Template Delete Manager Test ${timestamp}`,
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
    const product = await prisma.product.create({
      data: {
        code: `PROD-DELETE-MANAGER-${timestamp}`,
        name: 'Product to Delete',
        status: 'ACTIVE',
        unitOfMeasure: 'UNITS',
        templateId: template.id.toString(),
        attributes: {},
      },
    });

    const response = await request(app.server)
      .delete(`/v1/products/${product.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(403);
  });

  it('should return 403 when USER tries to delete a product', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');

    // Create a template first
    const timestamp = Date.now();
    const template = makeTemplate({
      name: `Template Delete User Test ${timestamp}`,
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
    const product = await prisma.product.create({
      data: {
        code: `PROD-DELETE-USER-${timestamp}`,
        name: 'Product to Delete',
        status: 'ACTIVE',
        unitOfMeasure: 'UNITS',
        templateId: template.id.toString(),
        attributes: {},
      },
    });

    const response = await request(app.server)
      .delete(`/v1/products/${product.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(403);
  });

  it('should return 401 when no token is provided', async () => {
    // Create a real product to test 401
    const timestamp = Date.now();
    const template = makeTemplate({
      name: `Template Delete 401 Test ${timestamp}`,
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

    const product = await prisma.product.create({
      data: {
        code: `PROD-DELETE-401-${timestamp}`,
        name: 'Product for 401 Test',
        status: 'ACTIVE',
        unitOfMeasure: 'UNITS',
        templateId: template.id.toString(),
        attributes: {},
      },
    });

    const response = await request(app.server).delete(
      `/v1/products/${product.id}`,
    );

    expect(response.statusCode).toBe(401);
  });
});

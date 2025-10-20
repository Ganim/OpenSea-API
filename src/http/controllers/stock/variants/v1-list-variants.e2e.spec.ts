import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import type { FastifyInstance } from 'fastify';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let token: string;

describe('List Variants (E2E)', () => {
  beforeAll(async () => {
    await app.ready();

    const { token: authToken } = await createAndAuthenticateUser(
      app as unknown as FastifyInstance,
      'USER',
    );
    token = authToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to list all variants', async () => {
    const timestamp = Date.now();

    // Create template
    const templateDb = await prisma.template.create({
      data: {
        name: `List Variants Template ${timestamp}`,
        productAttributes: { brand: 'string' },
        variantAttributes: { color: 'string' },
      },
    });

    // Create product
    const productDb = await prisma.product.create({
      data: {
        code: `PROD-LIST-${timestamp}`,
        name: `Product For List ${timestamp}`,
        status: 'ACTIVE',
        unitOfMeasure: 'UNITS',
        templateId: templateDb.id,
        attributes: { brand: 'Samsung' },
      },
    });

    // Create variants
    await prisma.variant.createMany({
      data: [
        {
          productId: productDb.id,
          sku: `SKU-LIST-1-${timestamp}`,
          name: `Variant List 1 ${timestamp}`,
          price: 99.99,
          attributes: { color: 'red' },
        },
        {
          productId: productDb.id,
          sku: `SKU-LIST-2-${timestamp}`,
          name: `Variant List 2 ${timestamp}`,
          price: 89.99,
          attributes: { color: 'blue' },
        },
      ],
    });

    const response = await request(app.server)
      .get('/v1/variants')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.variants).toBeInstanceOf(Array);
    expect(response.body.variants.length).toBeGreaterThanOrEqual(2);
  });

  it('should return empty array when there are no variants', async () => {
    const timestamp = Date.now();

    // Create an isolated template and product without variants
    const templateDb = await prisma.template.create({
      data: {
        name: `Empty Template ${timestamp}`,
        productAttributes: { brand: 'string' },
      },
    });

    await prisma.product.create({
      data: {
        code: `PROD-EMPTY-${timestamp}`,
        name: `Product Empty ${timestamp}`,
        status: 'ACTIVE',
        unitOfMeasure: 'UNITS',
        templateId: templateDb.id,
        attributes: { brand: 'Samsung' },
      },
    });

    const response = await request(app.server)
      .get('/v1/variants')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.variants).toBeInstanceOf(Array);
  });
});

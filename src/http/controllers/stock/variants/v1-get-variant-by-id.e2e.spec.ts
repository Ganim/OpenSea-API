import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import type { FastifyInstance } from 'fastify';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let token: string;

describe('Get Variant By ID (E2E)', () => {
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

  it('should be able to get a variant by ID', async () => {
    const timestamp = Date.now();

    // Create template
    const templateDb = await prisma.template.create({
      data: {
        name: `Get Variant Template ${timestamp}`,
        productAttributes: { brand: 'string' },
        variantAttributes: { color: 'string' },
      },
    });

    // Create product
    const productDb = await prisma.product.create({
      data: {
        code: `PROD-GET-${timestamp}`,
        name: `Product For Get ${timestamp}`,
        status: 'ACTIVE',
        templateId: templateDb.id,
        attributes: { brand: 'Samsung' },
      },
    });

    // Create variant
    const variantDb = await prisma.variant.create({
      data: {
        productId: productDb.id,
        sku: `SKU-GET-${timestamp}`,
        name: `Variant Get ${timestamp}`,
        price: 99.99,
        attributes: { color: 'blue' },
        costPrice: 50.0,
      },
    });

    const response = await request(app.server)
      .get(`/v1/variants/${variantDb.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.variant).toEqual(
      expect.objectContaining({
        id: variantDb.id,
        productId: productDb.id,
        sku: `SKU-GET-${timestamp}`,
        name: `Variant Get ${timestamp}`,
        price: 99.99,
      }),
    );
  });

  it('should return 404 when variant does not exist', async () => {
    const response = await request(app.server)
      .get('/v1/variants/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Variant not found');
  });
});

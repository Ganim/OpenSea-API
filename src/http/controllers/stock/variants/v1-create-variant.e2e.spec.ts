import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import type { FastifyInstance } from 'fastify';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let token: string;

describe('Create Variant (E2E)', () => {
  beforeAll(async () => {
    await app.ready();

    const { token: authToken } = await createAndAuthenticateUser(
      app as unknown as FastifyInstance,
    );
    token = authToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to create a variant', async () => {
    const timestamp = Date.now();

    // Create template
    const templateDb = await prisma.template.create({
      data: {
        name: `Variant Template ${timestamp}`,
        productAttributes: { brand: 'string' },
        variantAttributes: { color: 'string', size: 'string' },
      },
    });

    // Create product
    const productDb = await prisma.product.create({
      data: {
        code: `PROD-VAR-${timestamp}`,
        name: `Product For Variant ${timestamp}`,
        status: 'ACTIVE',
        templateId: templateDb.id,
        attributes: { brand: 'Samsung' },
      },
    });

    const response = await request(app.server)
      .post('/v1/variants')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId: productDb.id,
        sku: `SKU-${timestamp}`,
        name: `Variant ${timestamp}`,
        price: 99.99,
        attributes: { color: 'blue', size: 'M' },
        costPrice: 50.0,
        profitMargin: 50,
        barcode: `BAR-${timestamp}`,
        minStock: 10,
        maxStock: 100,
        reorderPoint: 20,
        reorderQuantity: 50,
      });

    expect(response.status).toBe(201);
    expect(response.body.variant).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        productId: productDb.id,
        sku: `SKU-${timestamp}`,
        name: `Variant ${timestamp}`,
        price: 99.99,
      }),
    );
  });

  it('should not be able to create a variant with duplicate SKU', async () => {
    const timestamp = Date.now();

    // Create template
    const templateDb = await prisma.template.create({
      data: {
        name: `Variant Template Dup ${timestamp}`,
        productAttributes: { brand: 'string' },
        variantAttributes: { color: 'string' },
      },
    });

    // Create product
    const productDb = await prisma.product.create({
      data: {
        code: `PROD-VAR-DUP-${timestamp}`,
        name: `Product For Variant Dup ${timestamp}`,
        status: 'ACTIVE',
        templateId: templateDb.id,
        attributes: { brand: 'Samsung' },
      },
    });

    // Create first variant
    const sku = `SKU-DUP-${timestamp}`;
    await prisma.variant.create({
      data: {
        productId: productDb.id,
        sku,
        name: `First Variant ${timestamp}`,
        price: 99.99,
        attributes: { color: 'red' },
      },
    });

    // Try to create second variant with same SKU
    const response = await request(app.server)
      .post('/v1/variants')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId: productDb.id,
        sku,
        name: `Second Variant ${timestamp}`,
        price: 89.99,
        attributes: { color: 'blue' },
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('SKU already exists');
  });
});

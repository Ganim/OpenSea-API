import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import type { FastifyInstance } from 'fastify';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let token: string;

describe('List Variants by Product ID (E2E)', () => {
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

  it('should be able to list variants by product ID with aggregations', async () => {
    const timestamp = Date.now();

    // Create template
    const templateDb = await prisma.template.create({
      data: {
        name: `List Variants By Product Template ${timestamp}`,
        productAttributes: { brand: 'string' },
        variantAttributes: { color: 'string' },
      },
    });

    // Create product
    const productDb = await prisma.product.create({
      data: {
        code: `PROD-LIST-BY-ID-${timestamp}`,
        name: `Product For List By ID ${timestamp}`,
        status: 'ACTIVE',
        templateId: templateDb.id,
        attributes: { brand: 'Samsung' },
      },
    });

    // Create variants
    const variant1 = await prisma.variant.create({
      data: {
        productId: productDb.id,
        sku: `SKU-LIST-BY-ID-1-${timestamp}`,
        name: `Variant List By ID 1 ${timestamp}`,
        price: 99.99,
        attributes: { color: 'red' },
      },
    });

    const variant2 = await prisma.variant.create({
      data: {
        productId: productDb.id,
        sku: `SKU-LIST-BY-ID-2-${timestamp}`,
        name: `Variant List By ID 2 ${timestamp}`,
        price: 89.99,
        attributes: { color: 'blue' },
      },
    });

    // Create a location first
    const locationDb = await prisma.location.create({
      data: {
        code: `C${timestamp.toString().slice(-4)}`,
        titulo: 'Test Location',
        type: 'WAREHOUSE',
      },
    });

    // Create items for the variants
    await prisma.item.createMany({
      data: [
        {
          variantId: variant1.id,
          locationId: locationDb.id,
          uniqueCode: `ITEM-1-${timestamp}`,
          initialQuantity: 10,
          currentQuantity: 8,
          entryDate: new Date(),
          attributes: {},
        },
        {
          variantId: variant1.id,
          locationId: locationDb.id,
          uniqueCode: `ITEM-2-${timestamp}`,
          initialQuantity: 5,
          currentQuantity: 5,
          entryDate: new Date(),
          attributes: {},
        },
        {
          variantId: variant2.id,
          locationId: locationDb.id,
          uniqueCode: `ITEM-3-${timestamp}`,
          initialQuantity: 15,
          currentQuantity: 12,
          entryDate: new Date(),
          attributes: {},
        },
      ],
    });

    const response = await request(app.server)
      .get(`/v1/products/${productDb.id}/variants`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.variants).toBeInstanceOf(Array);
    expect(response.body.variants.length).toBe(2);

    // Check first variant
    const firstVariant = response.body.variants.find(
      (v: { id: string }) => v.id === variant1.id,
    );
    expect(firstVariant).toBeDefined();
    expect(firstVariant.productCode).toBe(productDb.code);
    expect(firstVariant.productName).toBe(productDb.name);
    expect(firstVariant.itemCount).toBe(2);
    expect(firstVariant.totalCurrentQuantity).toBe(13); // 8 + 5

    // Check second variant
    const secondVariant = response.body.variants.find(
      (v: { id: string }) => v.id === variant2.id,
    );
    expect(secondVariant).toBeDefined();
    expect(secondVariant.productCode).toBe(productDb.code);
    expect(secondVariant.productName).toBe(productDb.name);
    expect(secondVariant.itemCount).toBe(1);
    expect(secondVariant.totalCurrentQuantity).toBe(12);
  });

  it('should return empty array when product has no variants', async () => {
    const timestamp = Date.now();

    // Create template and product without variants
    const templateDb = await prisma.template.create({
      data: {
        name: `Empty Product Template ${timestamp}`,
        productAttributes: { brand: 'string' },
      },
    });

    const productDb = await prisma.product.create({
      data: {
        code: `PROD-EMPTY-${timestamp}`,
        name: `Product Empty ${timestamp}`,
        status: 'ACTIVE',
        templateId: templateDb.id,
        attributes: { brand: 'Samsung' },
      },
    });

    const response = await request(app.server)
      .get(`/v1/products/${productDb.id}/variants`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.variants).toBeInstanceOf(Array);
    expect(response.body.variants.length).toBe(0);
  });
});

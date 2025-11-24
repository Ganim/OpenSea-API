import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('List Items (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow authenticated user to LIST items', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');

    const timestamp = Date.now();

    // Create template
    const template = await prisma.template.create({
      data: {
        name: `Template List Items ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    // Create product
    const product = await prisma.product.create({
      data: {
        code: `PROD-LIST-ITEMS-${timestamp}`,
        name: `Product List Items ${timestamp}`,
        status: 'ACTIVE',
        unitOfMeasure: 'UNITS',
        templateId: template.id,
        attributes: {},
      },
    });

    // Create variant
    const variant = await prisma.variant.create({
      data: {
        productId: product.id,
        sku: `SKU-LIST-ITEMS-${timestamp}`,
        name: `Variant List Items ${timestamp}`,
        price: 100,
        attributes: {},
      },
    });

    // Create location
    const location = await prisma.location.create({
      data: {
        code: `I${timestamp.toString().slice(-4)}`,
        titulo: 'Warehouse for list items',
        type: 'WAREHOUSE',
      },
    });

    // Create items
    await prisma.item.create({
      data: {
        uniqueCode: `ITEM-LIST-1-${timestamp}`,
        variantId: variant.id,
        locationId: location.id,
        initialQuantity: 100,
        currentQuantity: 100,
        status: 'AVAILABLE',
        entryDate: new Date(),
        attributes: {},
      },
    });

    await prisma.item.create({
      data: {
        uniqueCode: `ITEM-LIST-2-${timestamp}`,
        variantId: variant.id,
        locationId: location.id,
        initialQuantity: 50,
        currentQuantity: 50,
        status: 'AVAILABLE',
        entryDate: new Date(),
        attributes: {},
      },
    });

    const response = await request(app.server)
      .get('/v1/items')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body.items).toBeDefined();
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.items.length).toBeGreaterThanOrEqual(2);
  });

  it('should filter items by variantId', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');

    const timestamp = Date.now();

    // Create template
    const template = await prisma.template.create({
      data: {
        name: `Template Filter ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    // Create product
    const product = await prisma.product.create({
      data: {
        code: `PROD-FILTER-${timestamp}`,
        name: `Product Filter ${timestamp}`,
        status: 'ACTIVE',
        unitOfMeasure: 'UNITS',
        templateId: template.id,
        attributes: {},
      },
    });

    // Create variant
    const variant = await prisma.variant.create({
      data: {
        productId: product.id,
        sku: `SKU-FILTER-${timestamp}`,
        name: `Variant Filter ${timestamp}`,
        price: 100,
        attributes: {},
      },
    });

    // Create location
    const location = await prisma.location.create({
      data: {
        code: `F${timestamp.toString().slice(-4)}`,
        titulo: 'Warehouse for filter',
        type: 'WAREHOUSE',
      },
    });

    // Create item
    await prisma.item.create({
      data: {
        uniqueCode: `ITEM-FILTER-${timestamp}`,
        variantId: variant.id,
        locationId: location.id,
        initialQuantity: 75,
        currentQuantity: 75,
        status: 'AVAILABLE',
        entryDate: new Date(),
        attributes: {},
      },
    });

    const response = await request(app.server)
      .get('/v1/items')
      .query({ variantId: variant.id })
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body.items).toBeDefined();
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.items.length).toBeGreaterThanOrEqual(1);
    expect(response.body.items[0].variantId).toBe(variant.id);
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server).get('/v1/items');

    expect(response.statusCode).toEqual(401);
  });
});

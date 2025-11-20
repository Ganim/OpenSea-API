import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('List Items by Location ID (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow authenticated user to LIST items by location ID', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');

    const timestamp = Date.now();

    // Create template
    const template = await prisma.template.create({
      data: {
        name: `Template List Items Location ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    // Create product
    const product = await prisma.product.create({
      data: {
        code: `PROD-LIST-LOC-${timestamp}`,
        name: `Product List Location ${timestamp}`,
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
        sku: `SKU-LIST-LOC-${timestamp}`,
        name: `Variant List Location ${timestamp}`,
        price: 100,
        attributes: {},
      },
    });

    // Create location
    const location = await prisma.location.create({
      data: {
        code: `LOC-LIST-${timestamp}`,
        locationType: 'WAREHOUSE',
      },
    });

    // Create another location (different one)
    const otherLocation = await prisma.location.create({
      data: {
        code: `LOC-OTHER-${timestamp}`,
        locationType: 'WAREHOUSE',
      },
    });

    // Create items in the target location
    await prisma.item.create({
      data: {
        uniqueCode: `ITEM-LOC-1-${timestamp}`,
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
        uniqueCode: `ITEM-LOC-2-${timestamp}`,
        variantId: variant.id,
        locationId: location.id,
        initialQuantity: 50,
        currentQuantity: 50,
        status: 'AVAILABLE',
        entryDate: new Date(),
        attributes: {},
      },
    });

    // Create item in different location (should not be returned)
    await prisma.item.create({
      data: {
        uniqueCode: `ITEM-OTHER-${timestamp}`,
        variantId: variant.id,
        locationId: otherLocation.id,
        initialQuantity: 25,
        currentQuantity: 25,
        status: 'AVAILABLE',
        entryDate: new Date(),
        attributes: {},
      },
    });

    const response = await request(app.server)
      .get(`/v1/items/by-location/${location.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body.items).toBeDefined();
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.items.length).toBe(2);

    // Check that all returned items belong to the correct location
    response.body.items.forEach((item: { locationId: string }) => {
      expect(item.locationId).toBe(location.id);
    });
  });

  it('should return empty array when location has no items', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');

    const timestamp = Date.now();

    // Create empty location
    const emptyLocation = await prisma.location.create({
      data: {
        code: `LOC-EMPTY-${timestamp}`,
        locationType: 'WAREHOUSE',
      },
    });

    const response = await request(app.server)
      .get(`/v1/items/by-location/${emptyLocation.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body.items).toBeDefined();
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.items.length).toBe(0);
  });

  it('should return 401 when not authenticated', async () => {
    const fakeLocationId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server).get(
      `/v1/items/by-location/${fakeLocationId}`,
    );

    expect(response.statusCode).toEqual(401);
  });
});

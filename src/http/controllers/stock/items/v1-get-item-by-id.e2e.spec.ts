import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Get Item By ID (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow authenticated user to GET an ITEM by ID', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');

    const timestamp = Date.now();

    // Create template
    const template = await prisma.template.create({
      data: {
        name: `Template Get Item Test ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    // Create product
    const product = await prisma.product.create({
      data: {
        code: `PROD-GET-ITEM-${timestamp}`,
        name: `Product Get Item ${timestamp}`,
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
        sku: `SKU-GET-ITEM-${timestamp}`,
        name: `Variant Get Item ${timestamp}`,
        price: 100,
        attributes: {},
      },
    });

    // Create location
    const location = await prisma.location.create({
      data: {
        code: `LOC-GET-ITEM-${timestamp}`,
        locationType: 'WAREHOUSE',
      },
    });

    // Create item
    const item = await prisma.item.create({
      data: {
        uniqueCode: `ITEM-GET-${timestamp}`,
        variantId: variant.id,
        locationId: location.id,
        initialQuantity: 100,
        currentQuantity: 100,
        status: 'AVAILABLE',
        entryDate: new Date(),
        attributes: {},
      },
    });

    const response = await request(app.server)
      .get(`/v1/items/${item.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body.item).toBeDefined();
    expect(response.body.item.id).toBe(item.id);
    expect(response.body.item.uniqueCode).toBe(`ITEM-GET-${timestamp}`);
    expect(response.body.item.initialQuantity).toBe(100);
    expect(response.body.item.currentQuantity).toBe(100);
    expect(response.body.item.status).toBe('AVAILABLE');
  });

  it('should return 404 when item does not exist', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');

    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .get(`/v1/items/${nonExistentId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server).get(
      '/v1/items/00000000-0000-0000-0000-000000000000',
    );

    expect(response.statusCode).toEqual(401);
  });
});

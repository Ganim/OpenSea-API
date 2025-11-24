import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('List Item Movements (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow authenticated user to LIST item movements', async () => {
    const { token, user } = await createAndAuthenticateUser(app, 'MANAGER');

    const timestamp = Date.now();

    // Create complete setup
    const template = await prisma.template.create({
      data: {
        name: `Template Movement Test ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    const product = await prisma.product.create({
      data: {
        code: `PROD-MOV-${timestamp}`,
        name: `Product Mov ${timestamp}`,
        status: 'ACTIVE',
        unitOfMeasure: 'UNITS',
        templateId: template.id,
        attributes: {},
      },
    });

    const variant = await prisma.variant.create({
      data: {
        productId: product.id,
        sku: `SKU-MOV-${timestamp}`,
        name: `Variant Mov ${timestamp}`,
        price: 100,
        attributes: {},
      },
    });

    const location = await prisma.location.create({
      data: {
        code: `L${timestamp.toString().slice(-4)}`,
        titulo: 'Warehouse for movements',
        type: 'WAREHOUSE',
      },
    });

    const item = await prisma.item.create({
      data: {
        uniqueCode: `ITEM-MOV-${timestamp}`,
        variantId: variant.id,
        locationId: location.id,
        initialQuantity: 100,
        currentQuantity: 100,
        status: 'AVAILABLE',
        entryDate: new Date(),
        attributes: {},
      },
    });

    // Create movement
    await prisma.itemMovement.create({
      data: {
        itemId: item.id,
        userId: user.user.id.toString(),
        quantity: 100,
        quantityAfter: 100,
        movementType: 'INVENTORY_ADJUSTMENT',
        reasonCode: 'PURCHASE',
      },
    });

    const response = await request(app.server)
      .get('/v1/item-movements')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body.movements).toBeDefined();
    expect(Array.isArray(response.body.movements)).toBe(true);
    expect(response.body.movements.length).toBeGreaterThanOrEqual(1);
  });

  it('should filter movements by itemId', async () => {
    const { token, user } = await createAndAuthenticateUser(app, 'MANAGER');

    const timestamp = Date.now();

    const template = await prisma.template.create({
      data: {
        name: `Template Filter Test ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

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

    const variant = await prisma.variant.create({
      data: {
        productId: product.id,
        sku: `SKU-FILTER-${timestamp}`,
        name: `Variant Filter ${timestamp}`,
        price: 100,
        attributes: {},
      },
    });

    const location = await prisma.location.create({
      data: {
        code: `F${timestamp.toString().slice(-4)}`,
        titulo: 'Warehouse for filter',
        type: 'WAREHOUSE',
      },
    });

    const item = await prisma.item.create({
      data: {
        uniqueCode: `ITEM-FILTER-${timestamp}`,
        variantId: variant.id,
        locationId: location.id,
        initialQuantity: 50,
        currentQuantity: 50,
        status: 'AVAILABLE',
        entryDate: new Date(),
        attributes: {},
      },
    });

    await prisma.itemMovement.create({
      data: {
        itemId: item.id,
        userId: user.user.id.toString(),
        quantity: 50,
        quantityAfter: 50,
        movementType: 'INVENTORY_ADJUSTMENT',
        reasonCode: 'PURCHASE',
      },
    });

    const response = await request(app.server)
      .get('/v1/item-movements')
      .query({ itemId: item.id })
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body.movements).toBeDefined();
    expect(response.body.movements.length).toBeGreaterThanOrEqual(1);
    expect(response.body.movements[0].itemId).toBe(item.id);
  });

  it('should filter movements by movementType', async () => {
    const { token, user } = await createAndAuthenticateUser(app, 'MANAGER');

    const timestamp = Date.now();

    const template = await prisma.template.create({
      data: {
        name: `Template Type Test ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    const product = await prisma.product.create({
      data: {
        code: `PROD-TYPE-${timestamp}`,
        name: `Product Type ${timestamp}`,
        status: 'ACTIVE',
        unitOfMeasure: 'UNITS',
        templateId: template.id,
        attributes: {},
      },
    });

    const variant = await prisma.variant.create({
      data: {
        productId: product.id,
        sku: `SKU-TYPE-${timestamp}`,
        name: `Variant Type ${timestamp}`,
        price: 100,
        attributes: {},
      },
    });

    const location = await prisma.location.create({
      data: {
        code: `T${timestamp.toString().slice(-4)}`,
        titulo: 'Warehouse for type',
        type: 'WAREHOUSE',
      },
    });

    const item = await prisma.item.create({
      data: {
        uniqueCode: `ITEM-TYPE-${timestamp}`,
        variantId: variant.id,
        locationId: location.id,
        initialQuantity: 75,
        currentQuantity: 75,
        status: 'AVAILABLE',
        entryDate: new Date(),
        attributes: {},
      },
    });

    await prisma.itemMovement.create({
      data: {
        itemId: item.id,
        userId: user.user.id.toString(),
        quantity: 75,
        quantityAfter: 75,
        movementType: 'INVENTORY_ADJUSTMENT',
        reasonCode: 'PURCHASE',
      },
    });

    const response = await request(app.server)
      .get('/v1/item-movements')
      .query({ movementType: 'INVENTORY_ADJUSTMENT' })
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body.movements).toBeDefined();
    expect(response.body.movements.length).toBeGreaterThanOrEqual(1);
    response.body.movements.forEach((movement: { movementType: string }) => {
      expect(movement.movementType).toBe('INVENTORY_ADJUSTMENT');
    });
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server).get('/v1/item-movements');

    expect(response.statusCode).toEqual(401);
  });
});

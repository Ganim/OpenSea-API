import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Transfer Item (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow MANAGER to TRANSFER ITEM between locations', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const timestamp = Date.now();

    // Create template
    const template = await prisma.template.create({
      data: {
        name: `Template Transfer Test ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    // Create product
    const product = await prisma.product.create({
      data: {
        code: `PROD-TRANSFER-${timestamp}`,
        name: `Product Transfer ${timestamp}`,
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
        sku: `SKU-TRANSFER-${timestamp}`,
        name: `Variant Transfer ${timestamp}`,
        price: 100,
        attributes: {},
      },
    });

    // Create source location
    const sourceLocation = await prisma.location.create({
      data: {
        code: `S${timestamp.toString().slice(-4)}`,
        titulo: 'Source warehouse',
        type: 'WAREHOUSE',
      },
    });

    // Create destination location
    const destLocation = await prisma.location.create({
      data: {
        code: `D${timestamp.toString().slice(-4)}`,
        titulo: 'Destination warehouse',
        type: 'WAREHOUSE',
      },
    });

    // Create item
    const item = await prisma.item.create({
      data: {
        uniqueCode: `ITEM-TRANSFER-${timestamp}`,
        variantId: variant.id,
        locationId: sourceLocation.id,
        initialQuantity: 100,
        currentQuantity: 100,
        status: 'AVAILABLE',
        entryDate: new Date(),
        attributes: {},
      },
    });

    const response = await request(app.server)
      .post('/v1/items/transfer')
      .set('Authorization', `Bearer ${token}`)
      .send({
        itemId: item.id,
        destinationLocationId: destLocation.id,
        reasonCode: 'RELOCATION',
        notes: 'Moving to new warehouse',
      });

    expect(response.statusCode).toEqual(200);
    expect(response.body.item).toBeDefined();
    expect(response.body.item.id).toBe(item.id);
    expect(response.body.item.locationId).toBe(destLocation.id);
    expect(response.body.movement).toBeDefined();
    expect(response.body.movement.movementType).toBe('TRANSFER');
  });

  it('should NOT allow USER to TRANSFER ITEM', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');

    const timestamp = Date.now();

    // Create complete setup
    const template = await prisma.template.create({
      data: {
        name: `Template User Transfer ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    const product = await prisma.product.create({
      data: {
        code: `PROD-USER-TRANSFER-${timestamp}`,
        name: `Product User Transfer ${timestamp}`,
        status: 'ACTIVE',
        unitOfMeasure: 'UNITS',
        templateId: template.id,
        attributes: {},
      },
    });

    const variant = await prisma.variant.create({
      data: {
        productId: product.id,
        sku: `SKU-USER-TRANSFER-${timestamp}`,
        name: `Variant User Transfer ${timestamp}`,
        price: 100,
        attributes: {},
      },
    });

    const location1 = await prisma.location.create({
      data: {
        code: `A${timestamp.toString().slice(-4)}`,
        titulo: 'User source warehouse',
        type: 'WAREHOUSE',
      },
    });

    const location2 = await prisma.location.create({
      data: {
        code: `J${timestamp.toString().slice(-4)}`,
        titulo: 'User dest warehouse',
        type: 'WAREHOUSE',
      },
    });

    const item = await prisma.item.create({
      data: {
        uniqueCode: `ITEM-USER-TRANSFER-${timestamp}`,
        variantId: variant.id,
        locationId: location1.id,
        initialQuantity: 100,
        currentQuantity: 100,
        status: 'AVAILABLE',
        entryDate: new Date(),
        attributes: {},
      },
    });

    const response = await request(app.server)
      .post('/v1/items/transfer')
      .set('Authorization', `Bearer ${token}`)
      .send({
        itemId: item.id,
        destinationLocationId: location2.id,
        reasonCode: 'RELOCATION',
      });

    expect(response.statusCode).toBe(403);
  });

  it('should NOT allow TRANSFER to same location', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const timestamp = Date.now();

    // Create complete setup
    const template = await prisma.template.create({
      data: {
        name: `Template Same Loc Test ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    const product = await prisma.product.create({
      data: {
        code: `PROD-SAMELOC-${timestamp}`,
        name: `Product SameLoc ${timestamp}`,
        status: 'ACTIVE',
        unitOfMeasure: 'UNITS',
        templateId: template.id,
        attributes: {},
      },
    });

    const variant = await prisma.variant.create({
      data: {
        productId: product.id,
        sku: `SKU-SAMELOC-${timestamp}`,
        name: `Variant SameLoc ${timestamp}`,
        price: 100,
        attributes: {},
      },
    });

    const location = await prisma.location.create({
      data: {
        code: `B${timestamp.toString().slice(-4)}`,
        titulo: 'Same location warehouse',
        type: 'WAREHOUSE',
      },
    });

    const item = await prisma.item.create({
      data: {
        uniqueCode: `ITEM-SAMELOC-${timestamp}`,
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
      .post('/v1/items/transfer')
      .set('Authorization', `Bearer ${token}`)
      .send({
        itemId: item.id,
        destinationLocationId: location.id, // Same location
        reasonCode: 'RELOCATION',
      });

    expect(response.statusCode).toBe(400);
  });
});

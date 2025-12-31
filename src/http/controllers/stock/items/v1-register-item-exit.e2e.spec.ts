import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Register Item Exit (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow MANAGER to REGISTER ITEM EXIT', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const timestamp = Date.now();

    // Create template
    const template = await prisma.template.create({
      data: {
        name: `Template Exit Test ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    // Create product
    const product = await prisma.product.create({
      data: {
        code: `PROD-EXIT-${timestamp}`,
        name: `Product Exit ${timestamp}`,
        status: 'ACTIVE',
        templateId: template.id,
        attributes: {},
      },
    });

    // Create variant
    const variant = await prisma.variant.create({
      data: {
        productId: product.id,
        sku: `SKU-EXIT-${timestamp}`,
        name: `Variant Exit ${timestamp}`,
        price: 100,
        attributes: {},
      },
    });

    // Create location
    const location = await prisma.location.create({
      data: {
        code: `Z${timestamp.toString().slice(-4)}`,
        titulo: 'Warehouse for exit',
        type: 'WAREHOUSE',
      },
    });

    // Create item
    const item = await prisma.item.create({
      data: {
        uniqueCode: `ITEM-EXIT-${timestamp}`,
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
      .post('/v1/items/exit')
      .set('Authorization', `Bearer ${token}`)
      .send({
        itemId: item.id,
        quantity: 30,
        movementType: 'SALE',
        notes: 'Sale exit',
      });

    expect(response.statusCode).toEqual(200);
    expect(response.body.item).toBeDefined();
    expect(response.body.item.id).toBe(item.id);
    expect(response.body.item.currentQuantity).toBe(70);
    expect(response.body.movement).toBeDefined();
    expect(response.body.movement.movementType).toBe('SALE');
    expect(response.body.movement.quantity).toBe(30);
  });

  it('should NOT allow user without permission to REGISTER ITEM EXIT', async () => {
    const { token } = await createAndAuthenticateUser(app, );

    const response = await request(app.server)
      .post('/v1/items/exit')
      .set('Authorization', `Bearer ${token}`)
      .send({
        itemId: '00000000-0000-0000-0000-000000000000',
        quantity: 10,
        movementType: 'SALE',
      });

    expect(response.statusCode).toBe(403);
  });

  it('should NOT allow EXIT with quantity greater than current', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const timestamp = Date.now();

    // Create complete setup
    const template = await prisma.template.create({
      data: {
        name: `Template Quantity Test ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    const product = await prisma.product.create({
      data: {
        code: `PROD-QTY-${timestamp}`,
        name: `Product Qty ${timestamp}`,
        status: 'ACTIVE',
        templateId: template.id,
        attributes: {},
      },
    });

    const variant = await prisma.variant.create({
      data: {
        productId: product.id,
        sku: `SKU-QTY-${timestamp}`,
        name: `Variant Qty ${timestamp}`,
        price: 100,
        attributes: {},
      },
    });

    const location = await prisma.location.create({
      data: {
        code: `Q${timestamp.toString().slice(-4)}`,
        titulo: 'Warehouse for qty test',
        type: 'WAREHOUSE',
      },
    });

    const item = await prisma.item.create({
      data: {
        uniqueCode: `ITEM-QTY-${timestamp}`,
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
      .post('/v1/items/exit')
      .set('Authorization', `Bearer ${token}`)
      .send({
        itemId: item.id,
        quantity: 100, // More than available
        movementType: 'SALE',
      });

    expect(response.statusCode).toBe(400);
  });
});

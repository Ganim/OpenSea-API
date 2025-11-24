import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Register Item Entry (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow MANAGER to REGISTER ITEM ENTRY', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const timestamp = Date.now();

    // Create template
    const template = await prisma.template.create({
      data: {
        name: `Template Entry Test ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    // Create product
    const product = await prisma.product.create({
      data: {
        code: `PROD-ENTRY-${timestamp}`,
        name: `Product Entry ${timestamp}`,
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
        sku: `SKU-ENTRY-${timestamp}`,
        name: `Variant Entry ${timestamp}`,
        price: 100,
        attributes: {},
      },
    });

    // Create location
    const location = await prisma.location.create({
      data: {
        code: `N${timestamp.toString().slice(-4)}`,
        titulo: 'Warehouse for entry',
        type: 'WAREHOUSE',
      },
    });

    const uniqueCode = `ITEM-ENTRY-${timestamp}`;

    const response = await request(app.server)
      .post('/v1/items/entry')
      .set('Authorization', `Bearer ${token}`)
      .send({
        uniqueCode,
        variantId: variant.id,
        locationId: location.id,
        quantity: 100,
        attributes: {},
        batchNumber: 'BATCH001',
        manufacturingDate: new Date('2025-01-01'),
        expiryDate: new Date('2026-01-01'),
        notes: 'Initial entry',
      });

    expect(response.statusCode).toEqual(201);
    expect(response.body.item).toBeDefined();
    expect(response.body.item.uniqueCode).toBe(uniqueCode);
    expect(response.body.item.variantId).toBe(variant.id);
    expect(response.body.item.locationId).toBe(location.id);
    expect(response.body.item.initialQuantity).toBe(100);
    expect(response.body.item.currentQuantity).toBe(100);
    expect(response.body.item.status).toBe('AVAILABLE');
    expect(response.body.movement).toBeDefined();
    expect(response.body.movement.movementType).toBe('INVENTORY_ADJUSTMENT');
    expect(response.body.movement.quantity).toBe(100);
  });

  it('should NOT allow USER to REGISTER ITEM ENTRY', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');

    const timestamp = Date.now();
    const uniqueCode = `ITEM-ENTRY-FORBIDDEN-${timestamp}`;

    const response = await request(app.server)
      .post('/v1/items/entry')
      .set('Authorization', `Bearer ${token}`)
      .send({
        uniqueCode,
        variantId: '00000000-0000-0000-0000-000000000000',
        locationId: '00000000-0000-0000-0000-000000000000',
        quantity: 100,
        attributes: {},
      });

    expect(response.statusCode).toBe(403);
  });

  it('should NOT allow DUPLICATE unique code', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const timestamp = Date.now();

    // Create template
    const template = await prisma.template.create({
      data: {
        name: `Template Duplicate Test ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    // Create product
    const product = await prisma.product.create({
      data: {
        code: `PROD-DUP-${timestamp}`,
        name: `Product Dup ${timestamp}`,
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
        sku: `SKU-DUP-${timestamp}`,
        name: `Variant Dup ${timestamp}`,
        price: 100,
        attributes: {},
      },
    });

    // Create location
    const location = await prisma.location.create({
      data: {
        code: `Y${timestamp.toString().slice(-4)}`,
        titulo: 'Warehouse for duplicate',
        type: 'WAREHOUSE',
      },
    });

    const uniqueCode = `ITEM-DUP-${timestamp}`;

    // First entry - should succeed
    await request(app.server)
      .post('/v1/items/entry')
      .set('Authorization', `Bearer ${token}`)
      .send({
        uniqueCode,
        variantId: variant.id,
        locationId: location.id,
        quantity: 50,
        attributes: {},
      });

    // Second entry with same unique code - should fail
    const response = await request(app.server)
      .post('/v1/items/entry')
      .set('Authorization', `Bearer ${token}`)
      .send({
        uniqueCode,
        variantId: variant.id,
        locationId: location.id,
        quantity: 50,
        attributes: {},
      });

    expect(response.statusCode).toBe(400);
  });
});

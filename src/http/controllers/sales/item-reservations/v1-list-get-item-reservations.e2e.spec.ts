import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('List and Get Item Reservations (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list item reservations with correct schema', async () => {
    const { token, user } = await createAndAuthenticateUser(app);
    const userId = user.user.id;

    const { randomUUID } = await import('node:crypto');
    const unique = randomUUID();

    const template = await prisma.template.create({
      data: {
        name: `Test Template ${unique}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    const product = await prisma.product.create({
      data: {
        name: `Test Product ${unique}`,
        code: `TEST-${unique}`,
        status: 'ACTIVE',
        attributes: {},
        templateId: template.id,
      },
    });

    const variant = await prisma.variant.create({
      data: {
        sku: `SKU-${unique}`,
        name: 'Test Variant',
        price: 100,
        attributes: {},
        productId: product.id,
      },
    });

    const warehouse = await prisma.warehouse.create({
      data: {
        code: `W${unique.slice(-3)}`,
        name: `Test Warehouse ${unique}`,
      },
    });

    const zone = await prisma.zone.create({
      data: {
        code: `Z${unique.slice(-3)}`,
        name: `Test Zone ${unique}`,
        warehouseId: warehouse.id,
        structure: {},
      },
    });

    const bin = await prisma.bin.create({
      data: {
        address: `${warehouse.code}-${zone.code}-01-A`,
        aisle: 1,
        shelf: 1,
        position: 'A',
        zoneId: zone.id,
      },
    });

    const item = await prisma.item.create({
      data: {
        uniqueCode: `ITEM-${unique}`,
        initialQuantity: 100,
        currentQuantity: 100,
        attributes: {},
        variantId: variant.id,
        binId: bin.id,
      },
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    await prisma.itemReservation.create({
      data: {
        itemId: item.id,
        userId,
        quantity: 10,
        reason: 'Test Reservation',
        expiresAt: tomorrow,
      },
    });

    const response = await request(app.server)
      .get('/v1/item-reservations')
      .query({ itemId: item.id })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('reservations');
    expect(Array.isArray(response.body.reservations)).toBe(true);
  });
});

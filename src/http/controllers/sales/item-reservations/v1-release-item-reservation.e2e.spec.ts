import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Release Item Reservation (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should release item reservation with correct schema', async () => {
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

    const reservation = await prisma.itemReservation.create({
      data: {
        itemId: item.id,
        userId,
        quantity: 10,
        reason: 'Test reservation',
        expiresAt: tomorrow,
      },
    });

    const response = await request(app.server)
      .patch(`/v1/item-reservations/${reservation.id}/release`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('reservation');
    expect(response.body.reservation).toHaveProperty('id', reservation.id);
    expect(response.body.reservation).toHaveProperty('isReleased', true);
  });
});

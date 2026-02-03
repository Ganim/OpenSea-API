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

    const tenant = await prisma.tenant.create({
      data: {
        name: `tenant-${unique}`,
        slug: `tenant-${unique}`,
        status: 'ACTIVE',
      },
    });
    const tenantId = tenant.id;

    const template = await prisma.template.create({
      data: {
        tenantId,
        name: `Test Template ${unique}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    const suffix = unique.replace(/-/g, '').slice(0, 4);

    const product = await prisma.product.create({
      data: {
        tenantId,
        name: `Test Product ${unique}`,
        slug: `test-product-${unique}`,
        fullCode: `001.000.${suffix}`,
        barcode: `BCRL${suffix}`,
        eanCode: `EAN${suffix}RL000`,
        upcCode: `UPC${suffix}RL00`,
        status: 'ACTIVE',
        attributes: {},
        templateId: template.id,
      },
    });

    const variant = await prisma.variant.create({
      data: {
        tenantId,
        sku: `SKU-${unique}`,
        name: 'Test Variant',
        slug: `test-variant-${unique}`,
        fullCode: `001.000.${suffix}.001`,
        sequentialCode: 1,
        barcode: `BCVR${suffix}`,
        eanCode: `EAN${suffix}VR000`,
        upcCode: `UPC${suffix}VR00`,
        price: 100,
        attributes: {},
        productId: product.id,
      },
    });

    const warehouse = await prisma.warehouse.create({
      data: {
        tenantId,
        code: `W${unique.slice(-3)}`,
        name: `Test Warehouse ${unique}`,
      },
    });

    const zone = await prisma.zone.create({
      data: {
        tenantId,
        code: `Z${unique.slice(-3)}`,
        name: `Test Zone ${unique}`,
        warehouseId: warehouse.id,
        structure: {},
      },
    });

    const bin = await prisma.bin.create({
      data: {
        tenantId,
        address: `${warehouse.code}-${zone.code}-01-A`,
        aisle: 1,
        shelf: 1,
        position: 'A',
        zoneId: zone.id,
      },
    });

    const item = await prisma.item.create({
      data: {
        tenantId,
        uniqueCode: `ITEM-${unique}`,
        slug: `item-${unique}`,
        fullCode: `001.000.${suffix}.001-00001`,
        sequentialCode: 1,
        barcode: `BCIRL${suffix}`,
        eanCode: `EAN${suffix}IR00`,
        upcCode: `UPC${suffix}IR0`,
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

import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Get Item Reservation By ID (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get item reservation by id with correct schema', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    const { randomUUID } = await import('node:crypto');
    const unique = randomUUID();

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
        barcode: `BCGI${suffix}`,
        eanCode: `EAN${suffix}GI000`,
        upcCode: `UPC${suffix}GI00`,
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
        barcode: `BCVG${suffix}`,
        eanCode: `EAN${suffix}VG000`,
        upcCode: `UPC${suffix}VG00`,
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
        barcode: `BCIGI${suffix}`,
        eanCode: `EAN${suffix}IG00`,
        upcCode: `UPC${suffix}IG0`,
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
        reason: 'Test reservation for get',
        expiresAt: tomorrow,
      },
    });

    const response = await request(app.server)
      .get(`/v1/item-reservations/${reservation.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('reservation');
    expect(response.body.reservation).toHaveProperty('id', reservation.id);
    expect(response.body.reservation).toHaveProperty('itemId', item.id);
  });

  it('should not get item reservation without auth token', async () => {
    const response = await request(app.server).get(
      '/v1/item-reservations/00000000-0000-0000-0000-000000000000',
    );

    expect(response.status).toBe(401);
  });
});

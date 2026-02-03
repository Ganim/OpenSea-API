import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Item Reservation (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create item reservation with correct schema', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    const { randomUUID } = await import('node:crypto');
    const unique = randomUUID();

    const template = await prisma.template.create({
      data: {
        name: `Test Template ${unique}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
        tenantId,
      },
    });

    const suffix = unique.replace(/-/g, '').slice(0, 4);

    const product = await prisma.product.create({
      data: {
        name: `Test Product ${unique}`,
        slug: `test-product-${unique}`,
        fullCode: `001.000.${suffix}`,
        barcode: `BCCR${suffix}`,
        eanCode: `EAN${suffix}CR000`,
        upcCode: `UPC${suffix}CR00`,
        status: 'ACTIVE',
        attributes: {},
        templateId: template.id,
        tenantId,
      },
    });

    const variant = await prisma.variant.create({
      data: {
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
        tenantId,
      },
    });

    const warehouse = await prisma.warehouse.create({
      data: {
        code: `W${unique.slice(-3)}`,
        name: `Test Warehouse ${unique}`,
        tenantId,
      },
    });

    const zone = await prisma.zone.create({
      data: {
        code: `Z${unique.slice(-3)}`,
        name: `Test Zone ${unique}`,
        warehouseId: warehouse.id,
        structure: {},
        tenantId,
      },
    });

    const bin = await prisma.bin.create({
      data: {
        address: `${warehouse.code}-${zone.code}-01-A`,
        aisle: 1,
        shelf: 1,
        position: 'A',
        zoneId: zone.id,
        tenantId,
      },
    });

    const item = await prisma.item.create({
      data: {
        uniqueCode: `ITEM-${unique}`,
        slug: `item-${unique}`,
        fullCode: `001.000.${suffix}.001-00001`,
        sequentialCode: 1,
        barcode: `BCICR${suffix}`,
        eanCode: `EAN${suffix}IC00`,
        upcCode: `UPC${suffix}IC0`,
        initialQuantity: 100,
        currentQuantity: 100,
        attributes: {},
        variantId: variant.id,
        binId: bin.id,
        tenantId,
      },
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const response = await request(app.server)
      .post('/v1/item-reservations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        itemId: item.id,
        userId,
        quantity: 10,
        reason: 'Test reservation',
        expiresAt: tomorrow.toISOString(),
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('reservation');
    expect(response.body.reservation).toHaveProperty('itemId', item.id);
    expect(response.body.reservation).toHaveProperty('quantity', 10);
  });
});

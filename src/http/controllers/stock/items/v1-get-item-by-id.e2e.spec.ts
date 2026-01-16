import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Get Item By ID (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get item by id with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const timestamp = Date.now();

    const template = await prisma.template.create({
      data: {
        name: `Template Get Item Test ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    const product = await prisma.product.create({
      data: {
        code: `PROD-GET-ITEM-${timestamp}`,
        name: `Product Get Item ${timestamp}`,
        status: 'ACTIVE',
        templateId: template.id,
        attributes: {},
      },
    });

    const variant = await prisma.variant.create({
      data: {
        productId: product.id,
        sku: `SKU-GET-ITEM-${timestamp}`,
        name: `Variant Get Item ${timestamp}`,
        price: 100,
        attributes: {},
      },
    });

    const warehouse = await prisma.warehouse.create({
      data: {
        code: `W${timestamp.toString().slice(-3)}`,
        name: 'Warehouse for item',
      },
    });

    const zone = await prisma.zone.create({
      data: {
        code: `Z${timestamp.toString().slice(-3)}`,
        name: 'Zone for item',
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
        uniqueCode: `ITEM-GET-${timestamp}`,
        variantId: variant.id,
        binId: bin.id,
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

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('item');
    expect(response.body.item).toHaveProperty('id', item.id);
    expect(response.body.item).toHaveProperty('uniqueCode');
  });
});

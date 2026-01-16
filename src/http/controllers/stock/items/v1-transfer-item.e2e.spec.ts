import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Transfer Item (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should transfer item with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const timestamp = Date.now();

    const template = await prisma.template.create({
      data: {
        name: `Template Transfer Test ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    const product = await prisma.product.create({
      data: {
        code: `PROD-TRANSFER-${timestamp}`,
        name: `Product Transfer ${timestamp}`,
        status: 'ACTIVE',
        templateId: template.id,
        attributes: {},
      },
    });

    const variant = await prisma.variant.create({
      data: {
        productId: product.id,
        sku: `SKU-TRANSFER-${timestamp}`,
        name: `Variant Transfer ${timestamp}`,
        price: 100,
        attributes: {},
      },
    });

    const sourceWarehouse = await prisma.warehouse.create({
      data: {
        code: `S${timestamp.toString().slice(-3)}`,
        name: 'Source warehouse',
      },
    });

    const sourceZone = await prisma.zone.create({
      data: {
        code: `ZS${timestamp.toString().slice(-2)}`,
        name: 'Source zone',
        warehouseId: sourceWarehouse.id,
        structure: {},
      },
    });

    const sourceBin = await prisma.bin.create({
      data: {
        address: `${sourceWarehouse.code}-${sourceZone.code}-01-A`,
        aisle: 1,
        shelf: 1,
        position: 'A',
        zoneId: sourceZone.id,
      },
    });

    const destWarehouse = await prisma.warehouse.create({
      data: {
        code: `D${timestamp.toString().slice(-3)}`,
        name: 'Destination warehouse',
      },
    });

    const destZone = await prisma.zone.create({
      data: {
        code: `ZD${timestamp.toString().slice(-2)}`,
        name: 'Destination zone',
        warehouseId: destWarehouse.id,
        structure: {},
      },
    });

    const destBin = await prisma.bin.create({
      data: {
        address: `${destWarehouse.code}-${destZone.code}-01-A`,
        aisle: 1,
        shelf: 1,
        position: 'A',
        zoneId: destZone.id,
      },
    });

    const item = await prisma.item.create({
      data: {
        uniqueCode: `ITEM-TRANSFER-${timestamp}`,
        variantId: variant.id,
        binId: sourceBin.id,
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
        destinationBinId: destBin.id,
        reasonCode: 'RELOCATION',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('item');
    expect(response.body.item).toHaveProperty('id', item.id);
    expect(response.body.item).toHaveProperty('binId', destBin.id);
    expect(response.body).toHaveProperty('movement');
  });
});

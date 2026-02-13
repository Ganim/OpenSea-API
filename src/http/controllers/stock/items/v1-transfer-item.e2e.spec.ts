import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProduct } from '@/utils/tests/factories/stock/create-product.e2e';
import { createVariant } from '@/utils/tests/factories/stock/create-variant.e2e';
import { createItemE2E } from '@/utils/tests/factories/stock/create-item.e2e';

describe('Transfer Item (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should transfer item with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const template = await prisma.template.create({
      data: {
        tenantId,
        name: `Template Transfer Test ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    const { product } = await createProduct({
      tenantId,
      name: `Product Transfer ${timestamp}`,
      templateId: template.id,
    });

    const { variant } = await createVariant({
      tenantId,
      productId: product.id,
      sku: `SKU-TRANSFER-${timestamp}`,
      name: `Variant Transfer ${timestamp}`,
      price: 100,
    });

    const sourceWarehouse = await prisma.warehouse.create({
      data: {
        tenantId,
        code: `S${timestamp.toString().slice(-3)}`,
        name: 'Source warehouse',
      },
    });

    const sourceZone = await prisma.zone.create({
      data: {
        tenantId,
        code: `ZS${timestamp.toString().slice(-2)}`,
        name: 'Source zone',
        warehouseId: sourceWarehouse.id,
        structure: {},
      },
    });

    const sourceBin = await prisma.bin.create({
      data: {
        tenantId,
        address: `${sourceWarehouse.code}-${sourceZone.code}-01-A`,
        aisle: 1,
        shelf: 1,
        position: 'A',
        zoneId: sourceZone.id,
      },
    });

    const destWarehouse = await prisma.warehouse.create({
      data: {
        tenantId,
        code: `D${timestamp.toString().slice(-3)}`,
        name: 'Destination warehouse',
      },
    });

    const destZone = await prisma.zone.create({
      data: {
        tenantId,
        code: `ZD${timestamp.toString().slice(-2)}`,
        name: 'Destination zone',
        warehouseId: destWarehouse.id,
        structure: {},
      },
    });

    const destBin = await prisma.bin.create({
      data: {
        tenantId,
        address: `${destWarehouse.code}-${destZone.code}-01-A`,
        aisle: 1,
        shelf: 1,
        position: 'A',
        zoneId: destZone.id,
      },
    });

    const { item } = await createItemE2E({
      tenantId,
      variantId: variant.id,
      uniqueCode: `ITEM-TRANSFER-${timestamp}`,
      binId: sourceBin.id,
      initialQuantity: 100,
      status: 'AVAILABLE',
      attributes: {},
      entryDate: new Date(),
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

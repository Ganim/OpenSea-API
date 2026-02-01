import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createProduct } from '@/utils/tests/factories/stock/create-product.e2e';
import { createVariant } from '@/utils/tests/factories/stock/create-variant.e2e';
import { createItemE2E } from '@/utils/tests/factories/stock/create-item.e2e';

describe('List Items (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list items with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const timestamp = Date.now();

    const template = await prisma.template.create({
      data: {
        name: `Template List Items ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    const { product } = await createProduct({
      name: `Product List Items ${timestamp}`,
      templateId: template.id,
    });

    const { variant } = await createVariant({
      productId: product.id,
      sku: `SKU-LIST-ITEMS-${timestamp}`,
      name: `Variant List Items ${timestamp}`,
      price: 100,
    });

    const warehouse = await prisma.warehouse.create({
      data: {
        code: `W${timestamp.toString().slice(-3)}`,
        name: 'Warehouse for list items',
      },
    });

    const zone = await prisma.zone.create({
      data: {
        code: `Z${timestamp.toString().slice(-3)}`,
        name: 'Zone for list items',
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

    await createItemE2E({
      variantId: variant.id,
      uniqueCode: `ITEM-LIST-${timestamp}`,
      binId: bin.id,
      initialQuantity: 100,
      status: 'AVAILABLE',
      attributes: {},
      entryDate: new Date(),
    });

    const response = await request(app.server)
      .get('/v1/items')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('items');
    expect(Array.isArray(response.body.items)).toBe(true);
  });
});

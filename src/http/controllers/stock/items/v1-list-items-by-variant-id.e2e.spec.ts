import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createProduct } from '@/utils/tests/factories/stock/create-product.e2e';
import { createVariant } from '@/utils/tests/factories/stock/create-variant.e2e';
import { createItemE2E } from '@/utils/tests/factories/stock/create-item.e2e';

describe('List Items By Variant ID (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list items by variant id with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const timestamp = Date.now();

    const template = await prisma.template.create({
      data: {
        name: `Template ByVar ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    const { product } = await createProduct({
      name: `Product ByVar ${timestamp}`,
      templateId: template.id,
    });

    const { variant } = await createVariant({
      productId: product.id,
      sku: `SKU-BYVAR-${timestamp}`,
      name: `Variant ByVar ${timestamp}`,
      price: 100,
    });

    const warehouse = await prisma.warehouse.create({
      data: {
        code: `R${timestamp.toString().slice(-3)}`,
        name: `Warehouse ByVar ${timestamp}`,
      },
    });

    const zone = await prisma.zone.create({
      data: {
        code: `ZR${timestamp.toString().slice(-2)}`,
        name: `Zone ByVar ${timestamp}`,
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
      uniqueCode: `ITEM-BYVAR-${timestamp}`,
      binId: bin.id,
      initialQuantity: 30,
      status: 'AVAILABLE',
      attributes: {},
      entryDate: new Date(),
    });

    const response = await request(app.server)
      .get(`/v1/items/by-variant/${variant.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('items');
    expect(Array.isArray(response.body.items)).toBe(true);
  });

  it('should not list items by variant id without auth token', async () => {
    const response = await request(app.server).get(
      '/v1/items/by-variant/00000000-0000-0000-0000-000000000000',
    );

    expect(response.status).toBe(401);
  });
});

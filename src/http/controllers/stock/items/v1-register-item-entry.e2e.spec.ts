import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createProduct } from '@/utils/tests/factories/stock/create-product.e2e';
import { createVariant } from '@/utils/tests/factories/stock/create-variant.e2e';

describe('Register Item Entry (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should register item entry with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const timestamp = Date.now();

    const { product } = await createProduct();
    const { variant } = await createVariant({ productId: product.id });

    const warehouse = await prisma.warehouse.create({
      data: {
        code: `N${timestamp.toString().slice(-3)}`,
        name: 'Warehouse for entry',
      },
    });

    const zone = await prisma.zone.create({
      data: {
        code: `ZN${timestamp.toString().slice(-2)}`,
        name: 'Zone for entry',
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

    const response = await request(app.server)
      .post('/v1/items/entry')
      .set('Authorization', `Bearer ${token}`)
      .send({
        uniqueCode: `ITEM-ENTRY-${timestamp}`,
        variantId: variant.id,
        binId: bin.id,
        quantity: 100,
        attributes: {},
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('item');
    expect(response.body.item).toHaveProperty('id');
    expect(response.body.item).toHaveProperty('uniqueCode');
    expect(response.body).toHaveProperty('movement');
  });

  it('should persist unitCost when provided in item entry', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const timestamp = Date.now();

    const { product } = await createProduct({
      name: `Product UnitCost ${timestamp}`,
    });
    const { variant } = await createVariant({
      productId: product.id,
      name: `Variant UnitCost ${timestamp}`,
    });

    const warehouse = await prisma.warehouse.create({
      data: {
        code: `U${timestamp.toString().slice(-3)}`,
        name: 'Warehouse for unitCost',
      },
    });

    const zone = await prisma.zone.create({
      data: {
        code: `ZU${timestamp.toString().slice(-2)}`,
        name: 'Zone for unitCost',
        warehouseId: warehouse.id,
        structure: {},
      },
    });

    const bin = await prisma.bin.create({
      data: {
        address: `${warehouse.code}-${zone.code}-01-B`,
        aisle: 1,
        shelf: 1,
        position: 'B',
        zoneId: zone.id,
      },
    });

    const response = await request(app.server)
      .post('/v1/items/entry')
      .set('Authorization', `Bearer ${token}`)
      .send({
        uniqueCode: `ITEM-UC-${timestamp}`,
        variantId: variant.id,
        binId: bin.id,
        quantity: 10,
        unitCost: 49.9,
        attributes: {},
      });

    expect(response.status).toBe(201);
    expect(response.body.item).toHaveProperty('unitCost', 49.9);
    expect(response.body.item).toHaveProperty('totalCost', 49.9 * 10);
  });
});

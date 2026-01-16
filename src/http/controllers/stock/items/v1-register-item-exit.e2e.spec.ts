import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Register Item Exit (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should register item exit with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const timestamp = Date.now();

    const template = await prisma.template.create({
      data: {
        name: `Template Exit Test ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    const product = await prisma.product.create({
      data: {
        code: `PROD-EXIT-${timestamp}`,
        name: `Product Exit ${timestamp}`,
        status: 'ACTIVE',
        templateId: template.id,
        attributes: {},
      },
    });

    const variant = await prisma.variant.create({
      data: {
        productId: product.id,
        sku: `SKU-EXIT-${timestamp}`,
        name: `Variant Exit ${timestamp}`,
        price: 100,
        attributes: {},
      },
    });

    const warehouse = await prisma.warehouse.create({
      data: {
        code: `Z${timestamp.toString().slice(-3)}`,
        name: 'Warehouse for exit',
      },
    });

    const zone = await prisma.zone.create({
      data: {
        code: `ZZ${timestamp.toString().slice(-2)}`,
        name: 'Zone for exit',
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
        uniqueCode: `ITEM-EXIT-${timestamp}`,
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
      .post('/v1/items/exit')
      .set('Authorization', `Bearer ${token}`)
      .send({
        itemId: item.id,
        quantity: 30,
        movementType: 'SALE',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('item');
    expect(response.body.item).toHaveProperty('id', item.id);
    expect(response.body).toHaveProperty('movement');
  });
});

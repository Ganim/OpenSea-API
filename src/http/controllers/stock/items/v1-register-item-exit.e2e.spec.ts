import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProduct } from '@/utils/tests/factories/stock/create-product.e2e';
import { createVariant } from '@/utils/tests/factories/stock/create-variant.e2e';
import { createItemE2E } from '@/utils/tests/factories/stock/create-item.e2e';

describe('Register Item Exit (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should register item exit with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const template = await prisma.template.create({
      data: {
        tenantId,
        name: `Template Exit Test ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    const { product } = await createProduct({
      tenantId,
      name: `Product Exit ${timestamp}`,
      templateId: template.id,
    });

    const { variant } = await createVariant({
      tenantId,
      productId: product.id,
      sku: `SKU-EXIT-${timestamp}`,
      name: `Variant Exit ${timestamp}`,
      price: 100,
    });

    const warehouse = await prisma.warehouse.create({
      data: {
        tenantId,
        code: `Z${timestamp.toString().slice(-3)}`,
        name: 'Warehouse for exit',
      },
    });

    const zone = await prisma.zone.create({
      data: {
        tenantId,
        code: `ZZ${timestamp.toString().slice(-2)}`,
        name: 'Zone for exit',
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

    const { item } = await createItemE2E({
      tenantId,
      variantId: variant.id,
      uniqueCode: `ITEM-EXIT-${timestamp}`,
      binId: bin.id,
      initialQuantity: 100,
      status: 'AVAILABLE',
      attributes: {},
      entryDate: new Date(),
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

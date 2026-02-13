import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProduct } from '@/utils/tests/factories/stock/create-product.e2e';
import { createVariant } from '@/utils/tests/factories/stock/create-variant.e2e';

describe('List Item Movements (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list item movements with correct schema', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const template = await prisma.template.create({
      data: {
        tenantId,
        name: `Template Movement Test ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    const { product } = await createProduct({
      tenantId,
      name: `Product Mov ${timestamp}`,
      templateId: template.id,
    });

    const { variant } = await createVariant({
      tenantId,
      productId: product.id,
      sku: `SKU-MOV-${timestamp}`,
      name: `Variant Mov ${timestamp}`,
      price: 100,
    });

    const warehouse = await prisma.warehouse.create({
      data: {
        tenantId,
        code: `L${timestamp.toString().slice(-3)}`,
        name: 'Warehouse for movements',
      },
    });

    const zone = await prisma.zone.create({
      data: {
        tenantId,
        code: `ZL${timestamp.toString().slice(-2)}`,
        name: 'Zone for movements',
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
        uniqueCode: `ITEM-MOV-${timestamp}`,
        slug: `item-mov-${timestamp}`,
        fullCode: `001.000.0001.001-${timestamp.toString().slice(-5)}`,
        sequentialCode: 1,
        barcode: `BCMOV${timestamp.toString().slice(-5)}`,
        eanCode: `EAN${timestamp.toString().slice(-8)}M`,
        upcCode: `UPC${timestamp.toString().slice(-7)}M`,
        variantId: variant.id,
        binId: bin.id,
        initialQuantity: 100,
        currentQuantity: 100,
        status: 'AVAILABLE',
        entryDate: new Date(),
        attributes: {},
      },
    });

    await prisma.itemMovement.create({
      data: {
        tenantId,
        itemId: item.id,
        userId: user.user.id.toString(),
        quantity: 100,
        quantityAfter: 100,
        movementType: 'INVENTORY_ADJUSTMENT',
        reasonCode: 'PURCHASE',
      },
    });

    const response = await request(app.server)
      .get('/v1/item-movements')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('movements');
    expect(Array.isArray(response.body.movements)).toBe(true);
  });
});

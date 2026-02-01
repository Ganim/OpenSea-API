import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createProduct } from '@/utils/tests/factories/stock/create-product.e2e';
import { createVariant } from '@/utils/tests/factories/stock/create-variant.e2e';

describe('Create Purchase Order (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create purchase order with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const timestamp = Date.now();

    const supplier = await prisma.supplier.create({
      data: {
        name: `Supplier PO ${timestamp}`,
        isActive: true,
      },
    });

    const template = await prisma.template.create({
      data: {
        name: `Template PO ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    const { product } = await createProduct({
      name: `Product PO ${timestamp}`,
      templateId: template.id,
    });

    const { variant } = await createVariant({
      productId: product.id,
      sku: `SKU-PO-${timestamp}`,
      name: `Variant PO ${timestamp}`,
      price: 150,
    });

    const response = await request(app.server)
      .post('/v1/purchase-orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        orderNumber: `PO-${timestamp}`,
        supplierId: supplier.id,
        expectedDate: new Date('2025-12-31').toISOString(),
        items: [
          {
            variantId: variant.id,
            quantity: 50,
            unitCost: 100,
          },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('purchaseOrder');
    expect(response.body.purchaseOrder).toHaveProperty('id');
    expect(response.body.purchaseOrder).toHaveProperty('orderNumber');
    expect(response.body.purchaseOrder).toHaveProperty('items');
  });
});

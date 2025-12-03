import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Get Purchase Order By ID (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow authenticated user to get purchase order by ID', async () => {
    const { token, user } = await createAndAuthenticateUser(app, 'MANAGER');

    const timestamp = Date.now();

    // Create supplier
    const supplier = await prisma.supplier.create({
      data: {
        name: `Supplier Get ${timestamp}`,
        isActive: true,
      },
    });

    // Create complete setup for variant
    const template = await prisma.template.create({
      data: {
        name: `Template Get ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    const product = await prisma.product.create({
      data: {
        code: `PROD-GET-${timestamp}`,
        name: `Product Get ${timestamp}`,
        status: 'ACTIVE',
        templateId: template.id,
        attributes: {},
      },
    });

    const variant = await prisma.variant.create({
      data: {
        productId: product.id,
        sku: `SKU-GET-${timestamp}`,
        name: `Variant Get ${timestamp}`,
        price: 200,
        attributes: {},
      },
    });

    // Create purchase order
    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        orderNumber: `PO-GET-${timestamp}`,
        status: 'PENDING',
        supplierId: supplier.id,
        createdBy: user.user.id.toString(),
        totalCost: 3000,
        expectedDate: new Date('2025-12-31'),
        notes: 'Test get order',
      },
    });

    // Create order item
    await prisma.purchaseOrderItem.create({
      data: {
        orderId: purchaseOrder.id,
        variantId: variant.id,
        quantity: 30,
        unitCost: 100,
        totalCost: 3000,
        notes: 'Test item',
      },
    });

    const response = await request(app.server)
      .get(`/v1/purchase-orders/${purchaseOrder.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.purchaseOrder).toBeDefined();
    expect(response.body.purchaseOrder.id).toBe(purchaseOrder.id);
    expect(response.body.purchaseOrder.orderNumber).toBe(`PO-GET-${timestamp}`);
    expect(response.body.purchaseOrder.status).toBe('PENDING');
    expect(response.body.purchaseOrder.supplierId).toBe(supplier.id);
    expect(response.body.purchaseOrder.totalCost).toBe(3000);
    expect(response.body.purchaseOrder.items).toHaveLength(1);
    expect(response.body.purchaseOrder.items[0].quantity).toBe(30);
    expect(response.body.purchaseOrder.items[0].unitCost).toBe(100);
  });

  it('should return 404 for non-existent purchase order', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const response = await request(app.server)
      .get('/v1/purchase-orders/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
  });

  it('should return 401 for unauthenticated request', async () => {
    const response = await request(app.server).get(
      '/v1/purchase-orders/00000000-0000-0000-0000-000000000000',
    );

    expect(response.statusCode).toBe(401);
  });
});

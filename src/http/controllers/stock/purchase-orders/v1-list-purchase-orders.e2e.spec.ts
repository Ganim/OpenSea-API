import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('List Purchase Orders (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow authenticated user to list all purchase orders', async () => {
    const { token, user } = await createAndAuthenticateUser(app);

    const timestamp = Date.now();

    // Create supplier
    const supplier = await prisma.supplier.create({
      data: {
        name: `Supplier List ${timestamp}`,
        isActive: true,
      },
    });

    // Create complete setup for variant
    const template = await prisma.template.create({
      data: {
        name: `Template List ${timestamp}`,
        productAttributes: {},
        variantAttributes: {},
        itemAttributes: {},
      },
    });

    const product = await prisma.product.create({
      data: {
        code: `PROD-LIST-${timestamp}`,
        name: `Product List ${timestamp}`,
        status: 'ACTIVE',
        templateId: template.id,
        attributes: {},
      },
    });

    const variant = await prisma.variant.create({
      data: {
        productId: product.id,
        sku: `SKU-LIST-${timestamp}`,
        name: `Variant List ${timestamp}`,
        price: 180,
        attributes: {},
      },
    });

    // Create purchase order
    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        orderNumber: `PO-LIST-${timestamp}`,
        status: 'PENDING',
        supplierId: supplier.id,
        createdBy: user.user.id.toString(),
        totalCost: 2500,
        expectedDate: new Date('2025-12-31'),
      },
    });

    // Create order item
    await prisma.purchaseOrderItem.create({
      data: {
        orderId: purchaseOrder.id,
        variantId: variant.id,
        quantity: 25,
        unitCost: 100,
        totalCost: 2500,
      },
    });

    const response = await request(app.server)
      .get('/v1/purchase-orders')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.purchaseOrders).toBeDefined();
    expect(Array.isArray(response.body.purchaseOrders)).toBe(true);
    expect(
      response.body.purchaseOrders.some(
        (po: { orderNumber: string }) =>
          po.orderNumber === `PO-LIST-${timestamp}`,
      ),
    ).toBe(true);
  });

  it('should allow filtering purchase orders by supplierId', async () => {
    const { token, user } = await createAndAuthenticateUser(app);

    const timestamp = Date.now();

    // Create specific supplier
    const supplier = await prisma.supplier.create({
      data: {
        name: `Supplier Filter ${timestamp}`,
        isActive: true,
      },
    });

    // Create another supplier
    const otherSupplier = await prisma.supplier.create({
      data: {
        name: `Other Supplier ${timestamp}`,
        isActive: true,
      },
    });

    // Create orders for both suppliers
    await prisma.purchaseOrder.create({
      data: {
        orderNumber: `PO-FILTER-1-${timestamp}`,
        status: 'PENDING',
        supplierId: supplier.id,
        createdBy: user.user.id.toString(),
        totalCost: 1000,
      },
    });

    await prisma.purchaseOrder.create({
      data: {
        orderNumber: `PO-FILTER-2-${timestamp}`,
        status: 'PENDING',
        supplierId: otherSupplier.id,
        createdBy: user.user.id.toString(),
        totalCost: 2000,
      },
    });

    const response = await request(app.server)
      .get('/v1/purchase-orders')
      .query({ supplierId: supplier.id })
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.purchaseOrders).toBeDefined();
    expect(Array.isArray(response.body.purchaseOrders)).toBe(true);

    // All returned orders should be from the specific supplier
    response.body.purchaseOrders.forEach((po: { supplierId: string }) => {
      expect(po.supplierId).toBe(supplier.id);
    });
  });

  it('should allow filtering purchase orders by status', async () => {
    const { token, user } = await createAndAuthenticateUser(app);

    const timestamp = Date.now();

    // Create supplier
    const supplier = await prisma.supplier.create({
      data: {
        name: `Supplier Status ${timestamp}`,
        isActive: true,
      },
    });

    // Create orders with different statuses
    await prisma.purchaseOrder.create({
      data: {
        orderNumber: `PO-STATUS-PENDING-${timestamp}`,
        status: 'PENDING',
        supplierId: supplier.id,
        createdBy: user.user.id.toString(),
        totalCost: 1000,
      },
    });

    await prisma.purchaseOrder.create({
      data: {
        orderNumber: `PO-STATUS-CONFIRMED-${timestamp}`,
        status: 'CONFIRMED',
        supplierId: supplier.id,
        createdBy: user.user.id.toString(),
        totalCost: 2000,
      },
    });

    const response = await request(app.server)
      .get('/v1/purchase-orders')
      .query({ status: 'PENDING' })
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.purchaseOrders).toBeDefined();
    expect(Array.isArray(response.body.purchaseOrders)).toBe(true);

    // All returned orders should have PENDING status
    response.body.purchaseOrders.forEach((po: { status: string }) => {
      expect(po.status).toBe('PENDING');
    });
  });

  it('should return 401 for unauthenticated request', async () => {
    const response = await request(app.server).get('/v1/purchase-orders');

    expect(response.statusCode).toBe(401);
  });
});

import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Cancel Purchase Order (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow MANAGER to cancel a purchase order', async () => {
    const { token, user } = await createAndAuthenticateUser(app, 'MANAGER');

    const timestamp = Date.now();

    // Create supplier
    const supplier = await prisma.supplier.create({
      data: {
        name: `Supplier Cancel ${timestamp}`,
        isActive: true,
      },
    });

    // Create purchase order
    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        orderNumber: `PO-CANCEL-${timestamp}`,
        status: 'PENDING',
        supplierId: supplier.id,
        createdBy: user.user.id.toString(),
        totalCost: 1500,
        expectedDate: new Date('2025-12-31'),
      },
    });

    const response = await request(app.server)
      .post(`/v1/purchase-orders/${purchaseOrder.id}/cancel`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.purchaseOrder).toBeDefined();
    expect(response.body.purchaseOrder.id).toBe(purchaseOrder.id);
    expect(response.body.purchaseOrder.status).toBe('CANCELLED');
    expect(response.body.purchaseOrder.orderNumber).toBe(
      `PO-CANCEL-${timestamp}`,
    );

    // Verify in database
    const cancelledOrder = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrder.id },
    });
    expect(cancelledOrder?.status).toBe('CANCELLED');
  });

  it('should NOT allow USER to cancel a purchase order', async () => {
    const { user: manager } = await createAndAuthenticateUser(app, 'MANAGER');
    const { token: userToken } = await createAndAuthenticateUser(app, 'USER');

    const timestamp = Date.now();

    // Create supplier
    const supplier = await prisma.supplier.create({
      data: {
        name: `Supplier User Cancel ${timestamp}`,
        isActive: true,
      },
    });

    // Create purchase order with manager
    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        orderNumber: `PO-USER-CANCEL-${timestamp}`,
        status: 'PENDING',
        supplierId: supplier.id,
        createdBy: manager.user.id.toString(),
        totalCost: 1000,
      },
    });

    // Try to cancel with USER role
    const response = await request(app.server)
      .post(`/v1/purchase-orders/${purchaseOrder.id}/cancel`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.statusCode).toBe(403);

    // Verify order is still PENDING
    const order = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrder.id },
    });
    expect(order?.status).toBe('PENDING');
  });

  it('should NOT allow cancelling already delivered purchase order', async () => {
    const { token, user } = await createAndAuthenticateUser(app, 'MANAGER');

    const timestamp = Date.now();

    // Create supplier
    const supplier = await prisma.supplier.create({
      data: {
        name: `Supplier Delivered ${timestamp}`,
        isActive: true,
      },
    });

    // Create delivered purchase order
    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        orderNumber: `PO-DELIVERED-${timestamp}`,
        status: 'DELIVERED',
        supplierId: supplier.id,
        createdBy: user.user.id.toString(),
        totalCost: 2000,
        expectedDate: new Date('2025-01-01'),
        receivedDate: new Date('2025-01-15'),
      },
    });

    const response = await request(app.server)
      .post(`/v1/purchase-orders/${purchaseOrder.id}/cancel`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(400);

    // Verify order is still DELIVERED
    const order = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrder.id },
    });
    expect(order?.status).toBe('DELIVERED');
  });

  it('should return 404 for non-existent purchase order', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const response = await request(app.server)
      .post('/v1/purchase-orders/00000000-0000-0000-0000-000000000000/cancel')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
  });
});

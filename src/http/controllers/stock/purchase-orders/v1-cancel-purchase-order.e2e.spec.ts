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

  it('should cancel purchase order with correct schema', async () => {
    const { token, user } = await createAndAuthenticateUser(app);
    const timestamp = Date.now();

    const supplier = await prisma.supplier.create({
      data: {
        name: `Supplier Cancel ${timestamp}`,
        isActive: true,
      },
    });

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

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('purchaseOrder');
    expect(response.body.purchaseOrder).toHaveProperty('id', purchaseOrder.id);
    expect(response.body.purchaseOrder).toHaveProperty('status', 'CANCELLED');
  });
});

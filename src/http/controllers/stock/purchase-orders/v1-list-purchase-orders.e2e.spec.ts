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

  it('should list purchase orders with correct schema', async () => {
    const { token, user } = await createAndAuthenticateUser(app);
    const timestamp = Date.now();

    const tenant = await prisma.tenant.create({
      data: {
        name: `tenant-${timestamp}`,
        slug: `tenant-${timestamp}`,
        status: 'ACTIVE',
      },
    });
    const tenantId = tenant.id;

    const supplier = await prisma.supplier.create({
      data: {
        tenantId,
        name: `Supplier List ${timestamp}`,
        isActive: true,
      },
    });

    await prisma.purchaseOrder.create({
      data: {
        tenantId,
        orderNumber: `PO-LIST-${timestamp}`,
        status: 'PENDING',
        supplierId: supplier.id,
        createdBy: user.user.id.toString(),
        totalCost: 2500,
        expectedDate: new Date('2025-12-31'),
      },
    });

    const response = await request(app.server)
      .get('/v1/purchase-orders')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('purchaseOrders');
    expect(Array.isArray(response.body.purchaseOrders)).toBe(true);
  });
});

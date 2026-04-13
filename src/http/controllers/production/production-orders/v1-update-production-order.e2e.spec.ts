import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProduct } from '@/utils/tests/factories/stock/create-product.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Update Production Order (E2E)', () => {
  let tenantId: string;
  let orderId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;

    const { productId } = await createProduct({ tenantId });

    const { user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    const bom = await prisma.productionBom.create({
      data: {
        tenantId,
        productId,
        name: `BOM UPO ${Date.now()}`,
        version: 1,
        status: 'DRAFT',
        baseQuantity: 1,
        createdById: userId,
      },
    });

    const order = await prisma.productionOrder.create({
      data: {
        tenantId,
        orderNumber: `PO-UPD-${Date.now()}`,
        bomId: bom.id,
        productId,
        status: 'DRAFT',
        priority: 50,
        quantityPlanned: 100,
        createdById: userId,
      },
    });
    orderId = order.id;
  });

  it('should update a production order', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .put(`/v1/production/orders/${orderId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        priority: 90,
        quantityPlanned: 250,
        notes: 'Updated production notes',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('productionOrder');
    expect(response.body.productionOrder.priority).toBe(90);
    expect(response.body.productionOrder.quantityPlanned).toBe(250);
    expect(response.body.productionOrder.notes).toBe(
      'Updated production notes',
    );
  });
});

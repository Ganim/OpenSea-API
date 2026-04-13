import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProduct } from '@/utils/tests/factories/stock/create-product.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Cancel Production Order (E2E)', () => {
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
        name: `BOM CANCEL ${Date.now()}`,
        version: 1,
        status: 'DRAFT',
        baseQuantity: 1,
        createdById: userId,
      },
    });

    const order = await prisma.productionOrder.create({
      data: {
        tenantId,
        orderNumber: `PO-CAN-${Date.now()}`,
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

  it('should cancel a production order', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post(`/v1/production/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });
});

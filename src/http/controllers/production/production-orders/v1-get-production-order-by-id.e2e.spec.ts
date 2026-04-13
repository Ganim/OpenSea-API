import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProduct } from '@/utils/tests/factories/stock/create-product.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Get Production Order By ID (E2E)', () => {
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
        name: `BOM GPO ${Date.now()}`,
        version: 1,
        status: 'DRAFT',
        baseQuantity: 1,
        createdById: userId,
      },
    });

    const order = await prisma.productionOrder.create({
      data: {
        tenantId,
        orderNumber: `PO-GET-${Date.now()}`,
        bomId: bom.id,
        productId,
        status: 'DRAFT',
        priority: 60,
        quantityPlanned: 50,
        notes: 'Test order for get by id',
        createdById: userId,
      },
    });
    orderId = order.id;
  });

  it('should get a production order by id', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get(`/v1/production/orders/${orderId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('productionOrder');
    expect(response.body.productionOrder.id).toBe(orderId);
    expect(response.body.productionOrder.status).toBe('DRAFT');
    expect(response.body.productionOrder.priority).toBe(60);
    expect(response.body.productionOrder.quantityPlanned).toBe(50);
    expect(response.body.productionOrder.notes).toBe(
      'Test order for get by id',
    );
  });
});

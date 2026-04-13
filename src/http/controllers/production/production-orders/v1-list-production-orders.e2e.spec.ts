import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProduct } from '@/utils/tests/factories/stock/create-product.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('List Production Orders (E2E)', () => {
  let tenantId: string;

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
        name: `BOM LPO ${Date.now()}`,
        version: 1,
        status: 'DRAFT',
        baseQuantity: 1,
        createdById: userId,
      },
    });

    const ts = Date.now();
    await prisma.productionOrder.createMany({
      data: [
        {
          tenantId,
          orderNumber: `PO-A-${ts}`,
          bomId: bom.id,
          productId,
          status: 'DRAFT',
          priority: 50,
          quantityPlanned: 100,
          createdById: userId,
        },
        {
          tenantId,
          orderNumber: `PO-B-${ts}`,
          bomId: bom.id,
          productId,
          status: 'PLANNED',
          priority: 80,
          quantityPlanned: 200,
          createdById: userId,
        },
      ],
    });
  });

  it('should list production orders', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/production/orders')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('productionOrders');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.productionOrders)).toBe(true);
    expect(response.body.productionOrders.length).toBeGreaterThanOrEqual(2);
    expect(response.body.meta).toHaveProperty('total');
    expect(response.body.meta).toHaveProperty('page');
    expect(response.body.meta).toHaveProperty('limit');
    expect(response.body.meta).toHaveProperty('pages');
  });
});

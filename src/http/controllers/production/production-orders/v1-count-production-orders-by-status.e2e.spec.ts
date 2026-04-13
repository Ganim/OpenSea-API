import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProduct } from '@/utils/tests/factories/stock/create-product.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Count Production Orders By Status (E2E)', () => {
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
        name: `BOM COUNT ${Date.now()}`,
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
          orderNumber: `PO-CNT-A-${ts}`,
          bomId: bom.id,
          productId,
          status: 'DRAFT',
          priority: 50,
          quantityPlanned: 100,
          createdById: userId,
        },
        {
          tenantId,
          orderNumber: `PO-CNT-B-${ts}`,
          bomId: bom.id,
          productId,
          status: 'PLANNED',
          priority: 50,
          quantityPlanned: 200,
          createdById: userId,
        },
      ],
    });
  });

  it('should return counts grouped by status', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/production/orders/count-by-status')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('counts');
    expect(response.body.counts).toHaveProperty('DRAFT');
    expect(response.body.counts).toHaveProperty('PLANNED');
    expect(response.body.counts).toHaveProperty('FIRM');
    expect(response.body.counts).toHaveProperty('RELEASED');
    expect(response.body.counts).toHaveProperty('IN_PROCESS');
    expect(response.body.counts).toHaveProperty('TECHNICALLY_COMPLETE');
    expect(response.body.counts).toHaveProperty('CLOSED');
    expect(response.body.counts).toHaveProperty('CANCELLED');
    expect(typeof response.body.counts.DRAFT).toBe('number');
  });
});

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProduct } from '@/utils/tests/factories/stock/create-product.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Create Production Order (E2E)', () => {
  let tenantId: string;
  let bomId: string;
  let productId: string;
  let userId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;

    const product = await createProduct({ tenantId });
    productId = product.productId;

    const { user } = await createAndAuthenticateUser(app, { tenantId });
    userId = user.user.id;

    const bom = await prisma.productionBom.create({
      data: {
        tenantId,
        productId,
        name: `BOM CPO ${Date.now()}`,
        version: 1,
        status: 'DRAFT',
        baseQuantity: 1,
        createdById: userId,
      },
    });
    bomId = bom.id;
  });

  it('should create a production order', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/production/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        bomId,
        productId,
        priority: 75,
        quantityPlanned: 100,
        plannedStartDate: new Date(
          Date.now() + 24 * 60 * 60 * 1000,
        ).toISOString(),
        plannedEndDate: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        notes: 'Urgent production batch',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('productionOrder');
    expect(response.body.productionOrder).toHaveProperty('id');
    expect(response.body.productionOrder).toHaveProperty('orderNumber');
    expect(response.body.productionOrder.bomId).toBe(bomId);
    expect(response.body.productionOrder.productId).toBe(productId);
    expect(response.body.productionOrder.status).toBe('DRAFT');
    expect(response.body.productionOrder.priority).toBe(75);
    expect(response.body.productionOrder.quantityPlanned).toBe(100);
    expect(response.body.productionOrder.notes).toBe('Urgent production batch');
  });
});

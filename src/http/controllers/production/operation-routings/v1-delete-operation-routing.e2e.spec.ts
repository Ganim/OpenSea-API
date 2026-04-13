import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProduct } from '@/utils/tests/factories/stock/create-product.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Delete Operation Routing (E2E)', () => {
  let tenantId: string;
  let bomId: string;
  let routingId: string;

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
        name: `BOM DOR ${Date.now()}`,
        version: 1,
        status: 'DRAFT',
        baseQuantity: 1,
        createdById: userId,
      },
    });
    bomId = bom.id;

    const routing = await prisma.productionOperationRouting.create({
      data: {
        tenantId,
        bomId,
        sequence: 10,
        operationName: 'To Delete',
        executionTime: 15,
      },
    });
    routingId = routing.id;
  });

  it('should delete an operation routing', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .delete(`/v1/production/boms/${bomId}/routings/${routingId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });
});

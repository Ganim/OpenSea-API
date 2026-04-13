import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProduct } from '@/utils/tests/factories/stock/create-product.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Update Operation Routing (E2E)', () => {
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
        name: `BOM UOR ${Date.now()}`,
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
        operationName: 'Original Operation',
        executionTime: 20,
      },
    });
    routingId = routing.id;
  });

  it('should update an operation routing', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .put(`/v1/production/boms/${bomId}/routings/${routingId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        operationName: 'Updated Operation',
        executionTime: 45,
        setupTime: 10,
        isQualityCheck: true,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('operationRouting');
    expect(response.body.operationRouting.operationName).toBe(
      'Updated Operation',
    );
    expect(response.body.operationRouting.executionTime).toBe(45);
    expect(response.body.operationRouting.isQualityCheck).toBe(true);
  });
});

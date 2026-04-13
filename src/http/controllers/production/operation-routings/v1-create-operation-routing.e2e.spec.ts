import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProduct } from '@/utils/tests/factories/stock/create-product.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Create Operation Routing (E2E)', () => {
  let tenantId: string;
  let bomId: string;
  let userId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;

    const { productId } = await createProduct({ tenantId });

    const { user } = await createAndAuthenticateUser(app, { tenantId });
    userId = user.user.id;

    const bom = await prisma.productionBom.create({
      data: {
        tenantId,
        productId,
        name: `BOM COR ${Date.now()}`,
        version: 1,
        status: 'DRAFT',
        baseQuantity: 1,
        createdById: userId,
      },
    });
    bomId = bom.id;
  });

  it('should create an operation routing', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post(`/v1/production/boms/${bomId}/routings`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        sequence: 10,
        operationName: 'Cutting',
        description: 'Cut raw material to size',
        setupTime: 15,
        executionTime: 30,
        waitTime: 5,
        moveTime: 10,
        isQualityCheck: false,
        isOptional: false,
        skillRequired: 'Machine Operator',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('operationRouting');
    expect(response.body.operationRouting).toHaveProperty('id');
    expect(response.body.operationRouting.bomId).toBe(bomId);
    expect(response.body.operationRouting.sequence).toBe(10);
    expect(response.body.operationRouting.operationName).toBe('Cutting');
    expect(response.body.operationRouting.executionTime).toBe(30);
  });
});

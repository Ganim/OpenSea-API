import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProduct } from '@/utils/tests/factories/stock/create-product.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('List Operation Routings (E2E)', () => {
  let tenantId: string;
  let bomId: string;

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
        name: `BOM LOR ${Date.now()}`,
        version: 1,
        status: 'DRAFT',
        baseQuantity: 1,
        createdById: userId,
      },
    });
    bomId = bom.id;

    await prisma.productionOperationRouting.createMany({
      data: [
        {
          tenantId,
          bomId,
          sequence: 10,
          operationName: 'Step 1',
          executionTime: 20,
        },
        {
          tenantId,
          bomId,
          sequence: 20,
          operationName: 'Step 2',
          executionTime: 30,
        },
      ],
    });
  });

  it('should list operation routings for a BOM', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get(`/v1/production/boms/${bomId}/routings`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('operationRoutings');
    expect(Array.isArray(response.body.operationRoutings)).toBe(true);
    expect(response.body.operationRoutings.length).toBeGreaterThanOrEqual(2);
  });
});

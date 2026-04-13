import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProductionTestData } from '@/utils/tests/factories/production/create-production-test-data.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('List Material Reservations (E2E)', () => {
  let tenantId: string;
  let token: string;
  let userId: string;
  let productionOrderId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
    userId = auth.user.user.id;

    const data = await createProductionTestData({ tenantId, userId });
    productionOrderId = data.productionOrder.id;

    await prisma.productionMaterialReservation.create({
      data: {
        productionOrderId,
        materialId: data.productId,
        warehouseId: data.warehouseId,
        quantityReserved: 30,
      },
    });
  });

  it('should list material reservations', async () => {
    const response = await request(app.server)
      .get('/v1/production/material-reservations')
      .query({ productionOrderId })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('materialReservations');
    expect(Array.isArray(response.body.materialReservations)).toBe(true);
    expect(response.body.materialReservations.length).toBeGreaterThanOrEqual(1);
  });
});

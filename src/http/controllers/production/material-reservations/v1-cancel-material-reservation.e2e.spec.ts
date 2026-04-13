import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProductionTestData } from '@/utils/tests/factories/production/create-production-test-data.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Cancel Material Reservation (E2E)', () => {
  let tenantId: string;
  let token: string;
  let userId: string;
  let reservationId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
    userId = auth.user.user.id;

    const data = await createProductionTestData({ tenantId, userId });

    const reservation = await prisma.productionMaterialReservation.create({
      data: {
        productionOrderId: data.productionOrder.id,
        materialId: data.productId,
        warehouseId: data.warehouseId,
        quantityReserved: 20,
        status: 'RESERVED',
      },
    });
    reservationId = reservation.id;
  });

  it('should cancel a material reservation', async () => {
    const response = await request(app.server)
      .post(`/v1/production/material-reservations/${reservationId}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('materialReservation');
    expect(response.body.materialReservation.id).toBe(reservationId);
    expect(response.body.materialReservation.status).toBe('CANCELLED');
  });
});

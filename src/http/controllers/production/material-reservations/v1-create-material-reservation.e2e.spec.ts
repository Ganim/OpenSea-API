import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProductionTestData } from '@/utils/tests/factories/production/create-production-test-data.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Create Material Reservation (E2E)', () => {
  let tenantId: string;
  let token: string;
  let userId: string;
  let productionOrderId: string;
  let productId: string;
  let warehouseId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
    userId = auth.user.user.id;

    const data = await createProductionTestData({ tenantId, userId });
    productionOrderId = data.productionOrder.id;
    productId = data.productId;
    warehouseId = data.warehouseId;
  });

  it('should create a material reservation', async () => {
    const response = await request(app.server)
      .post('/v1/production/material-reservations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productionOrderId,
        materialId: productId,
        warehouseId,
        quantityReserved: 50,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('materialReservation');
    expect(response.body.materialReservation).toHaveProperty('id');
    expect(response.body.materialReservation.productionOrderId).toBe(
      productionOrderId,
    );
    expect(response.body.materialReservation.quantityReserved).toBe(50);
    expect(response.body.materialReservation.status).toBe('RESERVED');
  });
});

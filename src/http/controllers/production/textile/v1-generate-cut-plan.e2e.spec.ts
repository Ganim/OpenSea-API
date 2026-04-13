import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProductionTestData } from '@/utils/tests/factories/production/create-production-test-data.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Generate Cut Plan (E2E)', () => {
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
  });

  it('should generate a cut plan', async () => {
    const response = await request(app.server)
      .post(`/v1/production/orders/${productionOrderId}/cut-plan`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        matrix: {
          sizes: ['P', 'M', 'G'],
          colors: ['Branco', 'Preto'],
          quantities: {
            Branco: { P: 10, M: 20, G: 15 },
            Preto: { P: 12, M: 18, G: 10 },
          },
        },
        baseFabricConsumptionPerPiece: 1.5,
        wastePercentage: 5,
        spreadingTableWidthPieces: 50,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('cutPlan');
    expect(response.body.cutPlan).toHaveProperty('totalPieces');
    expect(response.body.cutPlan).toHaveProperty('piecesPerSize');
    expect(response.body.cutPlan).toHaveProperty('piecesPerColor');
    expect(response.body.cutPlan).toHaveProperty('totalEstimatedFabricMeters');
    expect(response.body.cutPlan).toHaveProperty('layersNeeded');
    expect(response.body.cutPlan.totalPieces).toBe(85);
  });
});

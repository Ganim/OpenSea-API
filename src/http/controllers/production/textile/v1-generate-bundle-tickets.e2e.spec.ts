import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProductionTestData } from '@/utils/tests/factories/production/create-production-test-data.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Generate Bundle Tickets (E2E)', () => {
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

  it('should generate bundle tickets', async () => {
    const response = await request(app.server)
      .post(`/v1/production/orders/${productionOrderId}/bundle-tickets`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        bundleSize: 10,
        sizes: ['P', 'M', 'G'],
        colors: ['Branco', 'Preto'],
        quantities: {
          Branco: { P: 10, M: 20, G: 10 },
          Preto: { P: 10, M: 10, G: 10 },
        },
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('result');
    expect(response.body.result).toHaveProperty('productionOrderId');
    expect(response.body.result).toHaveProperty('bundleSize');
    expect(response.body.result).toHaveProperty('totalBundles');
    expect(response.body.result).toHaveProperty('totalPieces');
    expect(response.body.result).toHaveProperty('bundles');
    expect(Array.isArray(response.body.result.bundles)).toBe(true);
    expect(response.body.result.totalPieces).toBe(70);
  });
});

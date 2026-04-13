import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProductionTestData } from '@/utils/tests/factories/production/create-production-test-data.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Create Production Entry (E2E)', () => {
  let tenantId: string;
  let token: string;
  let userId: string;
  let jobCardId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
    userId = auth.user.user.id;

    const data = await createProductionTestData({ tenantId, userId });
    jobCardId = data.jobCard.id;
  });

  it('should create a production entry', async () => {
    const response = await request(app.server)
      .post('/v1/production/production-entries')
      .set('Authorization', `Bearer ${token}`)
      .send({
        jobCardId,
        quantityGood: 30,
        quantityScrapped: 2,
        quantityRework: 1,
        notes: 'Morning shift production',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('productionEntry');
    expect(response.body.productionEntry).toHaveProperty('id');
    expect(response.body.productionEntry.jobCardId).toBe(jobCardId);
    expect(response.body.productionEntry.quantityGood).toBe(30);
    expect(response.body.productionEntry.quantityScrapped).toBe(2);
    expect(response.body.productionEntry.quantityRework).toBe(1);
  });
});

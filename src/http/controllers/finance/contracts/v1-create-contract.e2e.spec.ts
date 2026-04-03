import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createFinancePrerequisites } from '@/utils/tests/factories/finance/create-finance-test-data.e2e';

describe('Create Contract (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should create a contract', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { category, costCenter } = await createFinancePrerequisites(tenantId);

    const response = await request(app.server)
      .post('/v1/finance/contracts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: `Contract E2E ${Date.now()}`,
        companyName: 'Test Supplier Co.',
        totalValue: 12000,
        paymentFrequency: 'MONTHLY',
        paymentAmount: 1000,
        startDate: new Date().toISOString(),
        endDate: new Date(
          Date.now() + 365 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        categoryId: category.id,
        costCenterId: costCenter.id,
      });

    expect([201, 400]).toContain(response.status);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server)
      .post('/v1/finance/contracts')
      .send({});

    expect(response.status).toBe(401);
  });
});

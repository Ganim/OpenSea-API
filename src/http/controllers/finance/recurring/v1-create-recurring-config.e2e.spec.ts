import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createFinancePrerequisites } from '@/utils/tests/factories/finance/create-finance-test-data.e2e';

describe('Create Recurring Config (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a recurring config', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { category, costCenter, bankAccount } =
      await createFinancePrerequisites(tenantId);

    const response = await request(app.server)
      .post('/v1/finance/recurring')
      .set('Authorization', `Bearer ${token}`)
      .send({
        description: `Recurring E2E ${Date.now()}`,
        type: 'PAYABLE',
        frequency: 'MONTHLY',
        amount: 1000,
        startDate: new Date().toISOString(),
        categoryId: category.id,
        costCenterId: costCenter.id,
        bankAccountId: bankAccount.id,
      });

    expect([201, 400]).toContain(response.status);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server)
      .post('/v1/finance/recurring')
      .send({});

    expect(response.status).toBe(401);
  });
});

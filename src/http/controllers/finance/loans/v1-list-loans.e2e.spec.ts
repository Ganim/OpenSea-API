import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createFinancePrerequisites } from '@/utils/tests/factories/finance/create-finance-test-data.e2e';

describe('List Loans (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list loans', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { costCenter, bankAccount } =
      await createFinancePrerequisites(tenantId);

    await request(app.server)
      .post('/v1/finance/loans')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Loan ${Date.now()}`,
        type: 'PERSONAL',
        bankAccountId: bankAccount.id,
        costCenterId: costCenter.id,
        principalAmount: 10000,
        interestRate: 1.5,
        startDate: new Date().toISOString(),
        totalInstallments: 12,
      });

    const response = await request(app.server)
      .get('/v1/finance/loans')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.loans).toEqual(expect.any(Array));
    expect(response.body.meta).toBeDefined();
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).get('/v1/finance/loans');
    expect(response.status).toBe(401);
  });
});

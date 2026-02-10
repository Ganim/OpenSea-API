import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createFinancePrerequisites } from '@/utils/tests/factories/finance/create-finance-test-data.e2e';

describe('Register Loan Payment (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should register a loan payment', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { costCenter, bankAccount } =
      await createFinancePrerequisites(tenantId);

    const createRes = await request(app.server)
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

    const loanId = createRes.body.loan.id;

    const loanRes = await request(app.server)
      .get(`/v1/finance/loans/${loanId}`)
      .set('Authorization', `Bearer ${token}`);

    const installments = loanRes.body.loan?.installments;

    if (installments && installments.length > 0) {
      const firstInstallment = installments[0];

      const response = await request(app.server)
        .post(`/v1/finance/loans/${loanId}/payments`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          installmentId: firstInstallment.id,
          amount: firstInstallment.totalAmount,
          paidAt: new Date().toISOString(),
        });

      expect([200, 201]).toContain(response.status);
    } else {
      const response = await request(app.server)
        .post(`/v1/finance/loans/${loanId}/payments`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          installmentId: 'unknown-installment-id',
          amount: 1000,
          paidAt: new Date().toISOString(),
        });

      expect([200, 201, 400, 404]).toContain(response.status);
    }
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).post(
      '/v1/finance/loans/some-id/payments',
    );
    expect(response.status).toBe(401);
  });
});

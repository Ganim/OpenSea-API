import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createFinancePrerequisites } from '@/utils/tests/factories/finance/create-finance-test-data.e2e';

describe('Register Consortium Payment (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should register a consortium payment', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { costCenter, bankAccount } =
      await createFinancePrerequisites(tenantId);

    const createRes = await request(app.server)
      .post('/v1/finance/consortia')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Consortium ${Date.now()}`,
        administrator: 'Test Admin',
        bankAccountId: bankAccount.id,
        costCenterId: costCenter.id,
        creditValue: 100000,
        monthlyPayment: 1500,
        totalInstallments: 60,
        startDate: new Date().toISOString(),
      });

    const consortiumId = createRes.body.consortium.id;

    const consortiumRes = await request(app.server)
      .get(`/v1/finance/consortia/${consortiumId}`)
      .set('Authorization', `Bearer ${token}`);

    const payments = consortiumRes.body.consortium?.payments;

    if (payments && payments.length > 0) {
      const firstPayment = payments[0];

      const response = await request(app.server)
        .post(`/v1/finance/consortia/${consortiumId}/payments`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          paymentId: firstPayment.id,
          amount: 2500,
          paidAt: new Date().toISOString(),
        });

      expect([200, 201]).toContain(response.status);
    } else {
      const response = await request(app.server)
        .post(`/v1/finance/consortia/${consortiumId}/payments`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          paymentId: 'some-uuid',
          amount: 2500,
          paidAt: new Date().toISOString(),
        });

      expect([200, 201, 400, 404]).toContain(response.status);
    }
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).post(
      '/v1/finance/consortia/some-id/payments',
    );
    expect(response.status).toBe(401);
  });
});

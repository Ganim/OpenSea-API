import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createFinancePrerequisites } from '@/utils/tests/factories/finance/create-finance-test-data.e2e';

describe('Create Consortium (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a consortium', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { costCenter, bankAccount } =
      await createFinancePrerequisites(tenantId);

    const response = await request(app.server)
      .post('/v1/finance/consortia')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'E2E Consortium',
        administrator: 'Caixa Consórcios',
        bankAccountId: bankAccount.id,
        costCenterId: costCenter.id,
        creditValue: 200000,
        monthlyPayment: 2500,
        totalInstallments: 80,
        startDate: new Date().toISOString(),
      });

    expect(response.status).toBe(201);
    expect(response.body.consortium).toEqual(
      expect.objectContaining({
        name: 'E2E Consortium',
      }),
    );
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).post('/v1/finance/consortia');
    expect(response.status).toBe(401);
  });
});

import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createFinancePrerequisites } from '@/utils/tests/factories/finance/create-finance-test-data.e2e';

describe('Update Consortium (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should update a consortium', async () => {
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

    const response = await request(app.server)
      .put(`/v1/finance/consortia/${consortiumId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Consortium',
      });

    expect(response.status).toBe(200);
    expect(response.body.consortium).toEqual(
      expect.objectContaining({
        name: 'Updated Consortium',
      }),
    );
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).put(
      '/v1/finance/consortia/some-id',
    );
    expect(response.status).toBe(401);
  });
});

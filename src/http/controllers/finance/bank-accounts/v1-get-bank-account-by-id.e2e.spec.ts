import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createBankAccount } from '@/utils/tests/factories/finance/create-finance-test-data.e2e';

describe('Get Bank Account By ID (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get a bank account by id', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const bankAccount = await createBankAccount(tenantId);

    const response = await request(app.server)
      .get(`/v1/finance/bank-accounts/${bankAccount.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.bankAccount).toEqual(
      expect.objectContaining({
        id: bankAccount.id,
      }),
    );
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).get(
      '/v1/finance/bank-accounts/any-id',
    );

    expect(response.status).toBe(401);
  });
});

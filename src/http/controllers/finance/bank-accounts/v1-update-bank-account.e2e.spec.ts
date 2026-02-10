import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createBankAccount } from '@/utils/tests/factories/finance/create-finance-test-data.e2e';

describe('Update Bank Account (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should update a bank account', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const bankAccount = await createBankAccount(tenantId);

    const response = await request(app.server)
      .patch(`/v1/finance/bank-accounts/${bankAccount.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Account',
      });

    expect(response.status).toBe(200);
    expect(response.body.bankAccount).toEqual(
      expect.objectContaining({
        name: 'Updated Account',
      }),
    );
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).patch(
      '/v1/finance/bank-accounts/any-id',
    );

    expect(response.status).toBe(401);
  });
});

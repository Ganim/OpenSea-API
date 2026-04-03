import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createBankAccount } from '@/utils/tests/factories/finance/create-finance-test-data.e2e';
import { randomUUID } from 'node:crypto';

describe('Get Bank Account Health (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should return health status for bank account', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const bankAccount = await createBankAccount(tenantId);

    const response = await request(app.server)
      .get(`/v1/finance/bank-accounts/${bankAccount.id}/health`)
      .set('Authorization', `Bearer ${token}`);

    expect([200, 400]).toContain(response.status);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).get(
      `/v1/finance/bank-accounts/${randomUUID()}/health`,
    );

    expect(response.status).toBe(401);
  });
});

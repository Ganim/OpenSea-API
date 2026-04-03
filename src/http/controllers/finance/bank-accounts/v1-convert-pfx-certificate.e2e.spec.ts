import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createBankAccount } from '@/utils/tests/factories/finance/create-finance-test-data.e2e';
import { randomUUID } from 'node:crypto';

describe('Convert PFX Certificate (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should return 400 when no file is uploaded', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const bankAccount = await createBankAccount(tenantId);

    const response = await request(app.server)
      .post(`/v1/finance/bank-accounts/${bankAccount.id}/convert-pfx`)
      .set('Authorization', `Bearer ${token}`);

    expect([400, 415]).toContain(response.status);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).post(
      `/v1/finance/bank-accounts/${randomUUID()}/convert-pfx`,
    );

    expect(response.status).toBe(401);
  });
});

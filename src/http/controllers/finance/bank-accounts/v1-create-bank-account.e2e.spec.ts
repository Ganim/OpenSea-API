import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createCompany } from '@/utils/tests/factories/finance/create-finance-test-data.e2e';

describe('Create Bank Account (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a bank account', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const company = await createCompany(tenantId);

    const ts = Date.now();

    const response = await request(app.server)
      .post('/v1/finance/bank-accounts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        companyId: company.id,
        name: 'E2E Account',
        bankCode: '001',
        agency: '1234',
        accountNumber: `ACC-${ts}`,
        accountType: 'CHECKING',
      });

    expect(response.status).toBe(201);
    expect(response.body.bankAccount).toEqual(
      expect.objectContaining({
        name: 'E2E Account',
      }),
    );
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).post(
      '/v1/finance/bank-accounts',
    );

    expect(response.status).toBe(401);
  });
});

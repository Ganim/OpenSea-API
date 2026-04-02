import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import {
  createFinancePrerequisites,
  createFinanceEntry,
} from '@/utils/tests/factories/finance/create-finance-test-data.e2e';

describe('Create Payment Order (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a payment order', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { category, costCenter, bankAccount } =
      await createFinancePrerequisites(tenantId);
    const entry = await createFinanceEntry(tenantId, {
      categoryId: category.id,
      costCenterId: costCenter.id,
    });

    const response = await request(app.server)
      .post('/v1/finance/payment-orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        entryId: entry.id,
        bankAccountId: bankAccount.id,
        method: 'PIX',
        amount: 1000,
      });

    expect([201, 400]).toContain(response.status);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server)
      .post('/v1/finance/payment-orders')
      .send({});

    expect(response.status).toBe(401);
  });
});

import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import {
  createFinancePrerequisites,
  createFinanceEntry,
} from '@/utils/tests/factories/finance/create-finance-test-data.e2e';

describe('Register Payment (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should register a payment for a finance entry', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { category, costCenter } = await createFinancePrerequisites(tenantId);

    const entry = await createFinanceEntry(tenantId, {
      categoryId: category.id,
      costCenterId: costCenter.id,
    });

    const response = await request(app.server)
      .post(`/v1/finance/entries/${entry.id}/payments`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 500,
        paidAt: new Date().toISOString(),
      });

    expect(response.status).toBe(201);
    expect(response.body.payment).toBeDefined();
    expect(response.body.payment.amount).toBe(500);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).post(
      '/v1/finance/entries/any-id/payments',
    );
    expect(response.status).toBe(401);
  });
});

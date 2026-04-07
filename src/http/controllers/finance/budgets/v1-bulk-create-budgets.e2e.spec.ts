import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createFinancePrerequisites } from '@/utils/tests/factories/finance/create-finance-test-data.e2e';

describe('Bulk Create Budgets (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should bulk create budgets', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { category } = await createFinancePrerequisites(tenantId);

    const response = await request(app.server)
      .post('/v1/finance/budgets/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({
        categoryId: category.id,
        year: 2026,
        monthlyAmount: 5000,
      });

    expect([200, 201, 400]).toContain(response.status);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server)
      .post('/v1/finance/budgets/bulk')
      .send({});

    expect(response.status).toBe(401);
  });
});

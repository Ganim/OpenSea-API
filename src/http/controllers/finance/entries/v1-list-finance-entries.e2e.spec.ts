import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import {
  createFinancePrerequisites,
  createFinanceEntry,
} from '@/utils/tests/factories/finance/create-finance-test-data.e2e';

describe('List Finance Entries (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list finance entries', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { category, costCenter } = await createFinancePrerequisites(tenantId);

    await createFinanceEntry(tenantId, {
      categoryId: category.id,
      costCenterId: costCenter.id,
    });
    await createFinanceEntry(tenantId, {
      categoryId: category.id,
      costCenterId: costCenter.id,
    });

    const response = await request(app.server)
      .get('/v1/finance/entries')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.entries).toBeDefined();
    expect(Array.isArray(response.body.entries)).toBe(true);
    expect(response.body.meta).toBeDefined();
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).get('/v1/finance/entries');
    expect(response.status).toBe(401);
  });
});

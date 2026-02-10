import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createFinancePrerequisites } from '@/utils/tests/factories/finance/create-finance-test-data.e2e';

describe('Create Finance Entry (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a finance entry', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { category, costCenter } = await createFinancePrerequisites(tenantId);

    const response = await request(app.server)
      .post('/v1/finance/entries')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'PAYABLE',
        description: `E2E test entry ${Date.now()}`,
        categoryId: category.id,
        costCenterId: costCenter.id,
        expectedAmount: 1500,
        issueDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

    expect(response.status).toBe(201);
    expect(response.body.entry).toBeDefined();
    expect(response.body.entry.description).toContain('E2E test entry');
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).post('/v1/finance/entries');
    expect(response.status).toBe(401);
  });
});

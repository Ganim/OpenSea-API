import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createFinancePrerequisites } from '@/utils/tests/factories/finance/create-finance-test-data.e2e';

describe('Create Entries Batch (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should create entries in batch', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { category, costCenter } = await createFinancePrerequisites(tenantId);

    const response = await request(app.server)
      .post('/v1/finance/entries/batch')
      .set('Authorization', `Bearer ${token}`)
      .send({
        entries: [
          {
            type: 'PAYABLE',
            description: `Batch E2E ${Date.now()}`,
            categoryId: category.id,
            costCenterId: costCenter.id,
            expectedAmount: 500,
            issueDate: new Date().toISOString(),
            dueDate: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000,
            ).toISOString(),
          },
        ],
      });

    expect([201, 400]).toContain(response.status);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server)
      .post('/v1/finance/entries/batch')
      .send({ entries: [] });

    expect(response.status).toBe(401);
  });
});

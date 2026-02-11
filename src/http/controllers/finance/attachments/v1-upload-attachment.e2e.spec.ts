import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import {
  createFinanceEntry,
  createFinancePrerequisites,
} from '@/utils/tests/factories/finance/create-finance-test-data.e2e';

describe('Upload Attachment (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should reject upload without proper multipart data', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const { category, costCenter } = await createFinancePrerequisites(tenantId);

    const entry = await createFinanceEntry(tenantId, {
      categoryId: category.id,
      costCenterId: costCenter.id,
    });

    const response = await request(app.server)
      .post(`/v1/finance/entries/${entry.id}/attachments`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect([400, 500]).toContain(response.status);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).post(
      '/v1/finance/entries/any-id/attachments',
    );

    expect(response.status).toBe(401);
  });
});

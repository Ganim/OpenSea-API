import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createFinanceCategory } from '@/utils/tests/factories/finance/create-finance-test-data.e2e';

describe('Update Finance Category (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should update a finance category', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const category = await createFinanceCategory(tenantId);

    const response = await request(app.server)
      .patch(`/v1/finance/categories/${category.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Category',
      });

    expect(response.status).toBe(200);
    expect(response.body.category).toEqual(
      expect.objectContaining({
        name: 'Updated Category',
      }),
    );
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).patch(
      '/v1/finance/categories/any-id',
    );

    expect(response.status).toBe(401);
  });
});

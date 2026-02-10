import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createCostCenter } from '@/utils/tests/factories/finance/create-finance-test-data.e2e';

describe('Update Cost Center (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should update a cost center', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const costCenter = await createCostCenter(tenantId);

    const response = await request(app.server)
      .patch(`/v1/finance/cost-centers/${costCenter.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Name',
      });

    expect(response.status).toBe(200);
    expect(response.body.costCenter).toEqual(
      expect.objectContaining({
        name: 'Updated Name',
      }),
    );
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).patch(
      '/v1/finance/cost-centers/any-id',
    );

    expect(response.status).toBe(401);
  });
});

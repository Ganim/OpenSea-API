import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createCostCenter } from '@/utils/tests/factories/finance/create-finance-test-data.e2e';

describe('List Cost Centers (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list cost centers', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    await createCostCenter(tenantId);
    await createCostCenter(tenantId);

    const response = await request(app.server)
      .get('/v1/finance/cost-centers')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.costCenters.length).toBeGreaterThanOrEqual(2);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).get('/v1/finance/cost-centers');

    expect(response.status).toBe(401);
  });
});

import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Get Last Supplier Entry (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should return last supplier entry or empty', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/finance/entries/last-supplier')
      .query({ supplierName: 'NonExistent Supplier' })
      .set('Authorization', `Bearer ${token}`);

    expect([200, 404]).toContain(response.status);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server)
      .get('/v1/finance/entries/last-supplier')
      .query({ supplierName: 'Test' });

    expect(response.status).toBe(401);
  });
});

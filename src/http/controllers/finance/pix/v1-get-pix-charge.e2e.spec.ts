import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Get Pix Charge (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should return 404 for non-existent txId', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/finance/pix/charge/nonexistent-tx-id')
      .set('Authorization', `Bearer ${token}`);

    expect([400, 404]).toContain(response.status);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).get(
      '/v1/finance/pix/charge/test-tx-id',
    );

    expect(response.status).toBe(401);
  });
});

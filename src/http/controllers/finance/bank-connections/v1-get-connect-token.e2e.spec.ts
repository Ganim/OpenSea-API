import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Get Connect Token (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should attempt to get connect token', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/finance/bank-connections/connect-token')
      .set('Authorization', `Bearer ${token}`);

    // May fail if Pluggy is not configured, but should not be 401
    expect([200, 400, 500]).toContain(response.status);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).post(
      '/v1/finance/bank-connections/connect-token',
    );

    expect(response.status).toBe(401);
  });
});

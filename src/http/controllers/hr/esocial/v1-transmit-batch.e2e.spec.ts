import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Transmit eSocial Batch (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).post(
      '/v1/esocial/batches/transmit',
    );

    expect(response.statusCode).toBe(401);
  });

  it('should attempt transmit (may fail without config)', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/esocial/batches/transmit')
      .set('Authorization', `Bearer ${token}`);

    // May return 400 (no approved events or no certificate), but should not be 401
    expect(response.statusCode).not.toBe(401);
  });
});

import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('List Marketplace Orders (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should list marketplace orders', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/marketplace-orders')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).get('/v1/marketplace-orders');

    expect(response.status).toBe(401);
  });
});

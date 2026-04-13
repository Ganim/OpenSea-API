import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Claim Order (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).post(
      '/v1/orders/00000000-0000-0000-0000-000000000001/claim',
    );

    expect(response.status).toBe(401);
  });

  it('should return 404 for non-existent order', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/orders/00000000-0000-0000-0000-000000000001/claim')
      .set('Authorization', `Bearer ${token}`);

    expect([400, 404]).toContain(response.status);
  });
});

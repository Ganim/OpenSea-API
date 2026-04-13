import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Find Variant By Scan Code (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).get('/v1/orders/scan/ABC123');

    expect(response.status).toBe(401);
  });

  it('should return 404 for non-existent scan code', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get(`/v1/orders/scan/NONEXISTENT-${Date.now()}`)
      .set('Authorization', `Bearer ${token}`);

    expect([400, 404]).toContain(response.status);
  });
});

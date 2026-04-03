import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('List User Auth Links (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should list auth links for a specific user', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { user: targetUser } = await createAndAuthenticateUser(app, {
      tenantId,
    });

    const response = await request(app.server)
      .get(`/v1/users/${targetUser.user.id}/auth-links`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('authLinks');
    expect(Array.isArray(response.body.authLinks)).toBe(true);
    expect(response.body.authLinks.length).toBeGreaterThanOrEqual(1);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).get(
      '/v1/users/00000000-0000-0000-0000-000000000000/auth-links',
    );

    expect(response.status).toBe(401);
  });
});

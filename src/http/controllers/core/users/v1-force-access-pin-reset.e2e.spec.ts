import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Force Access PIN Reset (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should force access PIN reset with correct schema', async () => {
    const { token: adminToken } = await createAndAuthenticateUser(app, {
      tenantId,
    });
    const { user: targetUserResponse } = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: [],
    });

    const response = await request(app.server)
      .post(`/v1/users/${targetUserResponse.user.id}/force-access-pin-reset`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('user');
    expect(response.body).toHaveProperty('message');
  });

  it('should return 404 for non-existent user', async () => {
    const { token: adminToken } = await createAndAuthenticateUser(app, {
      tenantId,
    });

    const response = await request(app.server)
      .post('/v1/users/00000000-0000-0000-0000-000000000000/force-access-pin-reset')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
  });

  it('should return 401 without auth token', async () => {
    const response = await request(app.server)
      .post('/v1/users/00000000-0000-0000-0000-000000000000/force-access-pin-reset');

    expect(response.status).toBe(401);
  });
});

import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Force Password Reset (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should force password reset with correct schema', async () => {
    const { token: adminToken } = await createAndAuthenticateUser(app, {
      tenantId,
    });
    const { user: targetUserResponse } = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: [],
    });

    const response = await request(app.server)
      .post(`/v1/users/${targetUserResponse.user.id}/force-password-reset`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        reason: 'Security policy compliance',
        sendEmail: false,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('user');
  });
});

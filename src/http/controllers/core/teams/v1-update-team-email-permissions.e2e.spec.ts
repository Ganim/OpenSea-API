import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Update Team Email Permissions (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should return 404 for non-existent team or account', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .patch(
        '/v1/teams/00000000-0000-0000-0000-000000000000/emails/00000000-0000-0000-0000-000000000001',
      )
      .set('Authorization', `Bearer ${token}`)
      .send({
        canRead: true,
        canSend: true,
        canManage: false,
      });

    expect([403, 404]).toContain(response.status);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .patch(
        '/v1/teams/00000000-0000-0000-0000-000000000000/emails/00000000-0000-0000-0000-000000000001',
      )
      .send({
        canRead: true,
        canSend: true,
        canManage: false,
      });

    expect(response.status).toBe(401);
  });
});

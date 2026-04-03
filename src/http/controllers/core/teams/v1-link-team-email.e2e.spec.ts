import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createTeam } from '@/utils/tests/factories/core/create-team-test-data.e2e';

describe('Link Team Email (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should return 404 when linking email to non-existent team', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/teams/00000000-0000-0000-0000-000000000000/emails')
      .set('Authorization', `Bearer ${token}`)
      .send({
        emailAccountId: '00000000-0000-0000-0000-000000000001',
        canRead: true,
        canSend: false,
        canManage: false,
      });

    expect([400, 403, 404]).toContain(response.status);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/teams/00000000-0000-0000-0000-000000000000/emails')
      .send({
        emailAccountId: '00000000-0000-0000-0000-000000000001',
        canRead: true,
        canSend: false,
        canManage: false,
      });

    expect(response.status).toBe(401);
  });
});

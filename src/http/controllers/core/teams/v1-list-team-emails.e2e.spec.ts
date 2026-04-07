import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createTeam } from '@/utils/tests/factories/core/create-team-test-data.e2e';

describe('List Team Emails (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should list emails for a team', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const team = await createTeam(tenantId, user.user.id);

    const response = await request(app.server)
      .get(`/v1/teams/${team.id}/emails`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('emailAccounts');
    expect(Array.isArray(response.body.emailAccounts)).toBe(true);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).get(
      '/v1/teams/00000000-0000-0000-0000-000000000000/emails',
    );

    expect(response.status).toBe(401);
  });
});

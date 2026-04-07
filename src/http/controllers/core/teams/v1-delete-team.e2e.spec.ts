import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createTeam } from '@/utils/tests/factories/core/create-team-test-data.e2e';

describe('Delete Team (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should soft delete a team (owner)', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;
    const team = await createTeam(tenantId, userId);

    const response = await request(app.server)
      .delete(`/v1/teams/${team.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);

    // Verify team is no longer accessible
    const getResponse = await request(app.server)
      .get(`/v1/teams/${team.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(getResponse.status).toBe(404);
  });

  it('should return 404 for non-existent team', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .delete('/v1/teams/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).delete(
      '/v1/teams/00000000-0000-0000-0000-000000000000',
    );

    expect(response.status).toBe(401);
  });

  it('should return 403 without permission', async () => {
    const { token } = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: [],
    });

    const response = await request(app.server)
      .delete('/v1/teams/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
  });
});

import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import {
  createTeam,
  createTeamMember,
} from '@/utils/tests/factories/core/create-team-test-data.e2e';

describe('Remove Team Member (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should remove a member (owner removes member)', async () => {
    const { token, user: ownerUser } = await createAndAuthenticateUser(app, {
      tenantId,
    });
    const ownerId = ownerUser.user.id;
    const team = await createTeam(tenantId, ownerId);

    const { user: memberUser } = await createAndAuthenticateUser(app, {
      tenantId,
    });
    const memberUserId = memberUser.user.id;
    const member = await createTeamMember(team.id, memberUserId, tenantId);

    const response = await request(app.server)
      .delete(`/v1/teams/${team.id}/members/${member.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });

  it('should allow self-leave for non-owner', async () => {
    const { user: ownerUser } = await createAndAuthenticateUser(app, {
      tenantId,
    });
    const ownerId = ownerUser.user.id;
    const team = await createTeam(tenantId, ownerId);

    const { token: memberToken, user: memberUser } =
      await createAndAuthenticateUser(app, { tenantId });
    const memberUserId = memberUser.user.id;
    const member = await createTeamMember(team.id, memberUserId, tenantId);

    const response = await request(app.server)
      .delete(`/v1/teams/${team.id}/members/${member.id}`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(response.status).toBe(204);
  });

  it('should return 404 for non-existent member', async () => {
    const { token, user: ownerUser } = await createAndAuthenticateUser(app, {
      tenantId,
    });
    const ownerId = ownerUser.user.id;
    const team = await createTeam(tenantId, ownerId);

    const response = await request(app.server)
      .delete(
        `/v1/teams/${team.id}/members/00000000-0000-0000-0000-000000000000`,
      )
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).delete(
      '/v1/teams/00000000-0000-0000-0000-000000000000/members/00000000-0000-0000-0000-000000000001',
    );

    expect(response.status).toBe(401);
  });
});

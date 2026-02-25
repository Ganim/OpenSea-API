import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import {
  createTeam,
  createTeamMember,
} from '@/utils/tests/factories/core/create-team-test-data.e2e';

describe('Change Team Member Role (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should change member role to ADMIN (owner)', async () => {
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
      .patch(`/v1/teams/${team.id}/members/${member.id}/role`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'ADMIN' });

    expect(response.status).toBe(200);
    expect(response.body.member.role).toBe('ADMIN');
  });

  it('should demote ADMIN to MEMBER', async () => {
    const { token, user: ownerUser } = await createAndAuthenticateUser(app, {
      tenantId,
    });
    const ownerId = ownerUser.user.id;
    const team = await createTeam(tenantId, ownerId);

    const { user: adminUser } = await createAndAuthenticateUser(app, {
      tenantId,
    });
    const adminUserId = adminUser.user.id;
    const admin = await createTeamMember(team.id, adminUserId, tenantId, {
      role: 'ADMIN',
    });

    const response = await request(app.server)
      .patch(`/v1/teams/${team.id}/members/${admin.id}/role`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'MEMBER' });

    expect(response.status).toBe(200);
    expect(response.body.member.role).toBe('MEMBER');
  });

  it('should return 404 for non-existent member', async () => {
    const { token, user: ownerUser } = await createAndAuthenticateUser(app, {
      tenantId,
    });
    const ownerId = ownerUser.user.id;
    const team = await createTeam(tenantId, ownerId);

    const response = await request(app.server)
      .patch(
        `/v1/teams/${team.id}/members/00000000-0000-0000-0000-000000000000/role`,
      )
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'ADMIN' });

    expect(response.status).toBe(404);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .patch(
        '/v1/teams/00000000-0000-0000-0000-000000000000/members/00000000-0000-0000-0000-000000000001/role',
      )
      .send({ role: 'ADMIN' });

    expect(response.status).toBe(401);
  });
});

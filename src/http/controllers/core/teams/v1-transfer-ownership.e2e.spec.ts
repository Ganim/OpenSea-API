import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import {
  createTeam,
  createTeamMember,
} from '@/utils/tests/factories/core/create-team-test-data.e2e';

describe('Transfer Team Ownership (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should transfer ownership to another member', async () => {
    const { token, user: ownerUser } = await createAndAuthenticateUser(app, {
      tenantId,
    });
    const ownerId = ownerUser.user.id;
    const team = await createTeam(tenantId, ownerId);

    const { user: memberUser } = await createAndAuthenticateUser(app, {
      tenantId,
    });
    const memberUserId = memberUser.user.id;
    await createTeamMember(team.id, memberUserId, tenantId);

    const response = await request(app.server)
      .post(`/v1/teams/${team.id}/transfer-ownership`)
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: memberUserId });

    expect(response.status).toBe(204);

    // Verify the new owner has OWNER role
    const membersResponse = await request(app.server)
      .get(`/v1/teams/${team.id}/members`)
      .set('Authorization', `Bearer ${token}`)
      .query({ role: 'OWNER' });

    expect(membersResponse.status).toBe(200);
    expect(membersResponse.body.data).toHaveLength(1);
    expect(membersResponse.body.data[0].userId).toBe(memberUserId);
  });

  it('should reject transfer to non-member', async () => {
    const { token, user: ownerUser } = await createAndAuthenticateUser(app, {
      tenantId,
    });
    const ownerId = ownerUser.user.id;
    const team = await createTeam(tenantId, ownerId);

    const { user: nonMember } = await createAndAuthenticateUser(app, {
      tenantId,
    });

    const response = await request(app.server)
      .post(`/v1/teams/${team.id}/transfer-ownership`)
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: nonMember.user.id });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('current member');
  });

  it('should reject transfer to self', async () => {
    const { token, user: ownerUser } = await createAndAuthenticateUser(app, {
      tenantId,
    });
    const ownerId = ownerUser.user.id;
    const team = await createTeam(tenantId, ownerId);

    const response = await request(app.server)
      .post(`/v1/teams/${team.id}/transfer-ownership`)
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: ownerId });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('yourself');
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/teams/00000000-0000-0000-0000-000000000000/transfer-ownership')
      .send({ userId: '00000000-0000-0000-0000-000000000001' });

    expect(response.status).toBe(401);
  });
});

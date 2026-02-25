import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createTeam } from '@/utils/tests/factories/core/create-team-test-data.e2e';

describe('Add Team Member (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  }, 180000);

  afterAll(async () => {
    await app.close();
  });

  it('should add a member to the team', async () => {
    const { token, user: ownerUser } = await createAndAuthenticateUser(app, { tenantId });
    const ownerId = ownerUser.user.id;
    const team = await createTeam(tenantId, ownerId);

    const { user: memberUser } = await createAndAuthenticateUser(app, { tenantId });
    const memberId = memberUser.user.id;

    const response = await request(app.server)
      .post(`/v1/teams/${team.id}/members`)
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: memberId });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('member');
    expect(response.body.member.userId).toBe(memberId);
    expect(response.body.member.role).toBe('MEMBER');
  });

  it('should add a member with ADMIN role', async () => {
    const { token, user: ownerUser } = await createAndAuthenticateUser(app, { tenantId });
    const ownerId = ownerUser.user.id;
    const team = await createTeam(tenantId, ownerId);

    const { user: memberUser } = await createAndAuthenticateUser(app, { tenantId });
    const memberId = memberUser.user.id;

    const response = await request(app.server)
      .post(`/v1/teams/${team.id}/members`)
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: memberId, role: 'ADMIN' });

    expect(response.status).toBe(201);
    expect(response.body.member.role).toBe('ADMIN');
  });

  it('should reject duplicate member', async () => {
    const { token, user: ownerUser } = await createAndAuthenticateUser(app, { tenantId });
    const ownerId = ownerUser.user.id;
    const team = await createTeam(tenantId, ownerId);

    const { user: memberUser } = await createAndAuthenticateUser(app, { tenantId });
    const memberId = memberUser.user.id;

    await request(app.server)
      .post(`/v1/teams/${team.id}/members`)
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: memberId });

    const response = await request(app.server)
      .post(`/v1/teams/${team.id}/members`)
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: memberId });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('already a member');
  });

  it('should return 404 for non-existent team', async () => {
    const { token, user: memberUser } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/teams/00000000-0000-0000-0000-000000000000/members')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: memberUser.user.id });

    expect(response.status).toBe(404);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/teams/00000000-0000-0000-0000-000000000000/members')
      .send({ userId: '00000000-0000-0000-0000-000000000001' });

    expect(response.status).toBe(401);
  });
});

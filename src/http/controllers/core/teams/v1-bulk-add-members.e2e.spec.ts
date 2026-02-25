import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createTeam } from '@/utils/tests/factories/core/create-team-test-data.e2e';

describe('Bulk Add Team Members (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should add multiple members at once', async () => {
    const { token, user: ownerUser } = await createAndAuthenticateUser(app, {
      tenantId,
    });
    const ownerId = ownerUser.user.id;
    const team = await createTeam(tenantId, ownerId);

    const { user: user1 } = await createAndAuthenticateUser(app, { tenantId });
    const { user: user2 } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post(`/v1/teams/${team.id}/members/bulk`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        members: [
          { userId: user1.user.id },
          { userId: user2.user.id, role: 'ADMIN' },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body.added).toHaveLength(2);
    expect(response.body.skipped).toHaveLength(0);
  });

  it('should skip already existing members', async () => {
    const { token, user: ownerUser } = await createAndAuthenticateUser(app, {
      tenantId,
    });
    const ownerId = ownerUser.user.id;
    const team = await createTeam(tenantId, ownerId);

    const { user: user1 } = await createAndAuthenticateUser(app, { tenantId });
    const { user: user2 } = await createAndAuthenticateUser(app, { tenantId });

    // Add user1 first
    await request(app.server)
      .post(`/v1/teams/${team.id}/members`)
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: user1.user.id });

    // Bulk add user1 (existing) + user2 (new)
    const response = await request(app.server)
      .post(`/v1/teams/${team.id}/members/bulk`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        members: [{ userId: user1.user.id }, { userId: user2.user.id }],
      });

    expect(response.status).toBe(200);
    expect(response.body.added).toHaveLength(1);
    expect(response.body.skipped).toHaveLength(1);
    expect(response.body.skipped[0]).toBe(user1.user.id);
  });

  it('should return 404 for non-existent team', async () => {
    const { token, user: user1 } = await createAndAuthenticateUser(app, {
      tenantId,
    });

    const response = await request(app.server)
      .post('/v1/teams/00000000-0000-0000-0000-000000000000/members/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({ members: [{ userId: user1.user.id }] });

    expect(response.status).toBe(404);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/teams/00000000-0000-0000-0000-000000000000/members/bulk')
      .send({
        members: [{ userId: '00000000-0000-0000-0000-000000000001' }],
      });

    expect(response.status).toBe(401);
  });
});

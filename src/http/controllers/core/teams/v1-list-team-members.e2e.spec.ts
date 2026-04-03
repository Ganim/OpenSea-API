import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import {
  createTeam,
  createTeamMember,
} from '@/utils/tests/factories/core/create-team-test-data.e2e';

describe('List Team Members (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should list team members with pagination', async () => {
    const { token, user: ownerUser } = await createAndAuthenticateUser(app, {
      tenantId,
    });
    const ownerId = ownerUser.user.id;
    const team = await createTeam(tenantId, ownerId);

    const { user: memberUser } = await createAndAuthenticateUser(app, {
      tenantId,
    });
    await createTeamMember(team.id, memberUser.user.id, tenantId);

    const response = await request(app.server)
      .get(`/v1/teams/${team.id}/members`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('meta');
    expect(response.body.data.length).toBe(2); // owner + member
    expect(response.body.meta.total).toBe(2);
  });

  it('should filter members by role', async () => {
    const { token, user: ownerUser } = await createAndAuthenticateUser(app, {
      tenantId,
    });
    const ownerId = ownerUser.user.id;
    const team = await createTeam(tenantId, ownerId);

    const { user: adminUser } = await createAndAuthenticateUser(app, {
      tenantId,
    });
    await createTeamMember(team.id, adminUser.user.id, tenantId, {
      role: 'ADMIN',
    });

    const response = await request(app.server)
      .get(`/v1/teams/${team.id}/members`)
      .set('Authorization', `Bearer ${token}`)
      .query({ role: 'OWNER' });

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBe(1);
    expect(response.body.data[0].role).toBe('OWNER');
  });

  it('should return 404 for non-existent team', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/teams/00000000-0000-0000-0000-000000000000/members')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).get(
      '/v1/teams/00000000-0000-0000-0000-000000000000/members',
    );

    expect(response.status).toBe(401);
  });
});

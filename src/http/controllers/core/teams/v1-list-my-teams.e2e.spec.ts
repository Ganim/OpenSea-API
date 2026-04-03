import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import {
  createTeam,
  createTeamMember,
} from '@/utils/tests/factories/core/create-team-test-data.e2e';

describe('List My Teams (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should list only teams the user belongs to', async () => {
    const { token, user: myUser } = await createAndAuthenticateUser(app, {
      tenantId,
    });
    const myUserId = myUser.user.id;

    // Create team where user is owner
    await createTeam(tenantId, myUserId, { name: `My Team ${Date.now()}` });

    // Create another team where user is a member
    const { user: otherOwner } = await createAndAuthenticateUser(app, {
      tenantId,
    });
    const otherTeam = await createTeam(tenantId, otherOwner.user.id, {
      name: `Other Team ${Date.now()}`,
    });
    await createTeamMember(otherTeam.id, myUserId, tenantId);

    const response = await request(app.server)
      .get('/v1/teams/my')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('meta');
    expect(response.body.meta.total).toBeGreaterThanOrEqual(2);
  });

  it('should return empty for user with no teams', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/teams/my')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(0);
    expect(response.body.meta.total).toBe(0);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).get('/v1/teams/my');

    expect(response.status).toBe(401);
  });
});

import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createTeam } from '@/utils/tests/factories/core/create-team-test-data.e2e';

describe('Update Team (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should update team name', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;
    const team = await createTeam(tenantId, userId);

    const response = await request(app.server)
      .put(`/v1/teams/${team.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Team Name' });

    expect(response.status).toBe(200);
    expect(response.body.team.name).toBe('Updated Team Name');
    expect(response.body.team.slug).toBe('updated-team-name');
  });

  it('should update description and color', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;
    const team = await createTeam(tenantId, userId);

    const response = await request(app.server)
      .put(`/v1/teams/${team.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'Nova descrição', color: '#ff0000' });

    expect(response.status).toBe(200);
    expect(response.body.team.description).toBe('Nova descrição');
    expect(response.body.team.color).toBe('#ff0000');
  });

  it('should reject empty name', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;
    const team = await createTeam(tenantId, userId);

    const response = await request(app.server)
      .put(`/v1/teams/${team.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '' });

    expect(response.status).toBe(400);
  });

  it('should return 404 for non-existent team', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .put('/v1/teams/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ghost Team' });

    expect(response.status).toBe(404);
  });

  it('should return 403 without permission', async () => {
    const { token } = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: [],
    });

    const response = await request(app.server)
      .put('/v1/teams/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'No Perm' });

    expect(response.status).toBe(403);
  });
});

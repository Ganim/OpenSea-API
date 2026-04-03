import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createTeam } from '@/utils/tests/factories/core/create-team-test-data.e2e';

describe('List Teams (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should list teams with pagination', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;

    await createTeam(tenantId, userId, { name: `List Team A ${Date.now()}` });
    await createTeam(tenantId, userId, { name: `List Team B ${Date.now()}` });

    const response = await request(app.server)
      .get('/v1/teams')
      .set('Authorization', `Bearer ${token}`)
      .query({ page: 1, limit: 10 });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.meta.total).toBeGreaterThanOrEqual(2);
  });

  it('should filter teams by search', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });
    const userId = user.user.id;
    const uniqueName = `SearchTarget ${Date.now()}`;

    await createTeam(tenantId, userId, { name: uniqueName });

    const response = await request(app.server)
      .get('/v1/teams')
      .set('Authorization', `Bearer ${token}`)
      .query({ search: 'SearchTarget' });

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    expect(response.body.data[0].name).toContain('SearchTarget');
  });

  it('should return empty for no match', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/teams')
      .set('Authorization', `Bearer ${token}`)
      .query({ search: 'NONEXISTENT_TEAM_NAME_12345' });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(0);
    expect(response.body.meta.total).toBe(0);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).get('/v1/teams');

    expect(response.status).toBe(401);
  });
});

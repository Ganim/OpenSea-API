import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { makePermissionGroup } from '@/utils/tests/factories/rbac/make-permission-group';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Get Permission Group By ID (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow authenticated USER to GET group by ID with users and permissions', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const group = await makePermissionGroup();

    const response = await request(app.server)
      .get(`/v1/rbac/permission-groups/${group.id.toString()}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      group: expect.objectContaining({
        id: group.id.toString(),
        name: group.name,
        isSystem: group.isSystem,
        isActive: group.isActive,
        users: expect.any(Array),
        permissions: expect.any(Array),
      }),
    });
  });

  it('should return 404 for NON-EXISTENT group', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .get('/v1/rbac/permission-groups/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(404);
  });

  it('should NOT allow unauthenticated request', async () => {
    const group = await makePermissionGroup();

    const response = await request(app.server).get(
      `/v1/rbac/permission-groups/${group.id.toString()}`,
    );

    expect(response.statusCode).toEqual(401);
  });
});

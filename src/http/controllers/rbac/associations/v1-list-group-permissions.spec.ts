import { app } from '@/app';
import { makeAddPermissionToGroupUseCase } from '@/use-cases/rbac/associations/factories/make-add-permission-to-group-use-case';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { makePermission } from '@/utils/tests/factories/rbac/make-permission';
import { makePermissionGroup } from '@/utils/tests/factories/rbac/make-permission-group';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('List Group Permissions (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow authenticated USER to LIST group permissions', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');
    const group = await makePermissionGroup();
    const permission1 = await makePermission();
    const permission2 = await makePermission();

    const addPermissionUseCase = makeAddPermissionToGroupUseCase();
    await addPermissionUseCase.execute({
      groupId: group.id.toString(),
      permissionCode: permission1.code.value,
      effect: 'allow',
      conditions: null,
    });
    await addPermissionUseCase.execute({
      groupId: group.id.toString(),
      permissionCode: permission2.code.value,
      effect: 'deny',
      conditions: { department: 'hr' },
    });

    const response = await request(app.server)
      .get(`/v1/rbac/permission-groups/${group.id.toString()}/permissions`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      permissions: expect.arrayContaining([
        expect.objectContaining({
          id: permission1.id.toString(),
          effect: 'allow',
          conditions: null,
        }),
        expect.objectContaining({
          id: permission2.id.toString(),
          effect: 'deny',
          conditions: { department: 'hr' },
        }),
      ]),
    });
  });

  it('should return EMPTY array for group with no permissions', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');
    const group = await makePermissionGroup();

    const response = await request(app.server)
      .get(`/v1/rbac/permission-groups/${group.id.toString()}/permissions`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body.permissions).toEqual([]);
  });

  it('should return 404 for NON-EXISTENT group', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');

    const response = await request(app.server)
      .get(
        '/v1/rbac/permission-groups/00000000-0000-0000-0000-000000000000/permissions',
      )
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(404);
  });

  it('should NOT allow unauthenticated request', async () => {
    const group = await makePermissionGroup();

    const response = await request(app.server).get(
      `/v1/rbac/permission-groups/${group.id.toString()}/permissions`,
    );

    expect(response.statusCode).toEqual(401);
  });
});

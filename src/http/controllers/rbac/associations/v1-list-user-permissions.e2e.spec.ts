import { app } from '@/app';
import { makeAddPermissionToGroupUseCase } from '@/use-cases/rbac/associations/factories/make-add-permission-to-group-use-case';
import { makeAssignGroupToUserUseCase } from '@/use-cases/rbac/associations/factories/make-assign-group-to-user-use-case';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { makePermission } from '@/utils/tests/factories/rbac/make-permission';
import { makePermissionGroup } from '@/utils/tests/factories/rbac/make-permission-group';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('List User Permissions (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow authenticated USER to LIST own effective permissions', async () => {
    const { token, user } = await createAndAuthenticateUser(app, 'USER');
    const group = await makePermissionGroup();
    const permission1 = await makePermission({
      module: 'stock',
      resource: 'custom',
      action: 'read',
    });
    const permission2 = await makePermission({
      module: 'stock',
      resource: 'custom',
      action: 'create',
    });

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
      effect: 'allow',
      conditions: null,
    });

    const assignGroupUseCase = makeAssignGroupToUserUseCase();
    await assignGroupUseCase.execute({
      userId: user.user.id.toString(),
      groupId: group.id.toString(),
      grantedBy: null,
      expiresAt: null,
    });

    const response = await request(app.server)
      .get(`/v1/rbac/users/${user.user.id.toString()}/permissions`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      permissions: expect.arrayContaining([
        expect.objectContaining({
          code: permission1.code.value,
          effect: 'allow',
        }),
        expect.objectContaining({
          code: permission2.code.value,
          effect: 'allow',
        }),
      ]),
    });
  });

  it('should include permissions with CONDITIONS', async () => {
    const { token, user } = await createAndAuthenticateUser(app, 'USER');
    const group = await makePermissionGroup();
    const permission = await makePermission();

    const addPermissionUseCase = makeAddPermissionToGroupUseCase();
    await addPermissionUseCase.execute({
      groupId: group.id.toString(),
      permissionCode: permission.code.value,
      effect: 'allow',
      conditions: { department: 'finance' },
    });

    const assignGroupUseCase = makeAssignGroupToUserUseCase();
    await assignGroupUseCase.execute({
      userId: user.user.id.toString(),
      groupId: group.id.toString(),
      grantedBy: null,
      expiresAt: null,
    });

    const response = await request(app.server)
      .get(`/v1/rbac/users/${user.user.id.toString()}/permissions`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body.permissions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: permission.code.value,
          conditions: { department: 'finance' },
        }),
      ]),
    );
  });

  it('should handle DENY permissions', async () => {
    const { token, user } = await createAndAuthenticateUser(app, 'USER');
    const group = await makePermissionGroup();
    const permission = await makePermission({
      module: 'core',
      resource: 'custom',
      action: 'read',
    });

    const addPermissionUseCase = makeAddPermissionToGroupUseCase();
    await addPermissionUseCase.execute({
      groupId: group.id.toString(),
      permissionCode: permission.code.value,
      effect: 'deny',
      conditions: null,
    });

    const assignGroupUseCase = makeAssignGroupToUserUseCase();
    await assignGroupUseCase.execute({
      userId: user.user.id.toString(),
      groupId: group.id.toString(),
      grantedBy: null,
      expiresAt: null,
    });

    const response = await request(app.server)
      .get(`/v1/rbac/users/${user.user.id.toString()}/permissions`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body.permissions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: permission.code.value,
          effect: 'deny',
        }),
      ]),
    );
  });

  it('should FILTER by module', async () => {
    const { token, user } = await createAndAuthenticateUser(app, 'USER');
    const group = await makePermissionGroup();
    const productPermission = await makePermission({
      module: 'products',
      resource: 'product',
      action: 'read',
    });
    const orderPermission = await makePermission({
      module: 'orders',
      resource: 'order',
      action: 'read',
    });

    const addPermissionUseCase = makeAddPermissionToGroupUseCase();
    await addPermissionUseCase.execute({
      groupId: group.id.toString(),
      permissionCode: productPermission.code.value,
      effect: 'allow',
      conditions: null,
    });
    await addPermissionUseCase.execute({
      groupId: group.id.toString(),
      permissionCode: orderPermission.code.value,
      effect: 'allow',
      conditions: null,
    });

    const assignGroupUseCase = makeAssignGroupToUserUseCase();
    await assignGroupUseCase.execute({
      userId: user.user.id.toString(),
      groupId: group.id.toString(),
      grantedBy: null,
      expiresAt: null,
    });

    const response = await request(app.server)
      .get(`/v1/rbac/users/${user.user.id.toString()}/permissions`)
      .set('Authorization', `Bearer ${token}`)
      .query({ module: 'stock' });

    expect(response.statusCode).toEqual(200);
    expect(
      response.body.permissions.every(
        (perm: Record<string, unknown>) =>
          perm.code &&
          typeof perm.code === 'string' &&
          perm.code.startsWith('stock.'),
      ),
    ).toBe(true);
  });

  it('should support PAGINATION', async () => {
    const { token, user } = await createAndAuthenticateUser(app, 'USER');

    const response = await request(app.server)
      .get(`/v1/rbac/users/${user.user.id.toString()}/permissions`)
      .set('Authorization', `Bearer ${token}`)
      .query({ page: '1', limit: '10' });

    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty('permissions');
    expect(Array.isArray(response.body.permissions)).toBe(true);
  });

  it('should NOT allow unauthenticated request', async () => {
    const { user } = await createAndAuthenticateUser(app, 'USER');

    const response = await request(app.server).get(
      `/v1/rbac/users/${user.user.id.toString()}/permissions`,
    );

    expect(response.statusCode).toEqual(401);
  });
});

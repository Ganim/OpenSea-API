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

  it('should list group permissions with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const group = await makePermissionGroup();
    const permission = await makePermission();

    const addPermissionUseCase = makeAddPermissionToGroupUseCase();
    await addPermissionUseCase.execute({
      groupId: group.id.toString(),
      permissionCode: permission.code.value,
      effect: 'allow',
      conditions: null,
    });

    const response = await request(app.server)
      .get(`/v1/rbac/permission-groups/${group.id.toString()}/permissions`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty('permissions');
    expect(Array.isArray(response.body.permissions)).toBe(true);
  });
});

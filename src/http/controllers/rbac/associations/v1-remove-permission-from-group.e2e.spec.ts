import { app } from '@/app';
import { makeAddPermissionToGroupUseCase } from '@/use-cases/rbac/associations/factories/make-add-permission-to-group-use-case';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { makePermission } from '@/utils/tests/factories/rbac/make-permission';
import { makePermissionGroup } from '@/utils/tests/factories/rbac/make-permission-group';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Remove Permission From Group (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should remove permission from group with correct schema', async () => {
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
      .delete(
        `/v1/rbac/permission-groups/${group.id.toString()}/permissions/${permission.id.toString()}`,
      )
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(204);
  });
});

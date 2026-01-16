import { app } from '@/app';
import { makeAssignGroupToUserUseCase } from '@/use-cases/rbac/associations/factories/make-assign-group-to-user-use-case';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { makePermissionGroup } from '@/utils/tests/factories/rbac/make-permission-group';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('List User Groups (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list user groups with correct schema', async () => {
    const { token, user } = await createAndAuthenticateUser(app);
    const group = await makePermissionGroup();

    const assignGroupUseCase = makeAssignGroupToUserUseCase();
    await assignGroupUseCase.execute({
      userId: user.user.id.toString(),
      groupId: group.id.toString(),
      grantedBy: null,
      expiresAt: null,
    });

    const response = await request(app.server)
      .get(`/v1/rbac/users/${user.user.id.toString()}/groups`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty('groups');
    expect(Array.isArray(response.body.groups)).toBe(true);
  });
});

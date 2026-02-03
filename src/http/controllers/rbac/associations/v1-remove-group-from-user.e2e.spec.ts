import { app } from '@/app';
import { makeCreateUserUseCase } from '@/use-cases/core/users/factories/make-create-user-use-case';
import { makeAssignGroupToUserUseCase } from '@/use-cases/rbac/associations/factories/make-assign-group-to-user-use-case';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { makePermissionGroup } from '@/utils/tests/factories/rbac/make-permission-group';
import { faker } from '@faker-js/faker';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Remove Group From User (e2e)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should remove group from user with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const group = await makePermissionGroup();

    const createUserUseCase = makeCreateUserUseCase();
    const { user } = await createUserUseCase.execute({
      email: faker.internet.email(),
      password: 'Pass@123',
      username: `user${faker.string.uuid().slice(0, 8)}`,
    });

    const assignGroupUseCase = makeAssignGroupToUserUseCase();
    await assignGroupUseCase.execute({
      userId: user.id.toString(),
      groupId: group.id.toString(),
      grantedBy: null,
      expiresAt: null,
    });

    const response = await request(app.server)
      .delete(
        `/v1/rbac/users/${user.id.toString()}/groups/${group.id.toString()}`,
      )
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(204);
  });
});

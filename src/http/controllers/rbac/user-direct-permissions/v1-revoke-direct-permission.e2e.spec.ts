import { app } from '@/app';
import { makeCreateUserUseCase } from '@/use-cases/core/users/factories/make-create-user-use-case';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { makePermission } from '@/utils/tests/factories/rbac/make-permission';
import { makeUserDirectPermission } from '@/utils/tests/factories/rbac/make-user-direct-permission';
import { faker } from '@faker-js/faker';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Revoke Direct Permission (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should revoke direct permission with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const permission = await makePermission();

    const createUserUseCase = makeCreateUserUseCase();
    const uniqueId = faker.string.uuid().slice(0, 8);
    const { user } = await createUserUseCase.execute({
      email: `user-${uniqueId}@${faker.internet.domainName()}`,
      password: 'Pass@123',
      username: `user${uniqueId}`,
    });

    await makeUserDirectPermission({
      userId: user.id.toString(),
      permissionId: permission.id.toString(),
    });

    const response = await request(app.server)
      .delete(
        `/v1/rbac/users/${user.id.toString()}/direct-permissions/${permission.id.toString()}`,
      )
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(204);
  });
});

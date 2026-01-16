import { app } from '@/app';
import { makeCreateUserUseCase } from '@/use-cases/core/users/factories/make-create-user-use-case';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { makePermission } from '@/utils/tests/factories/rbac/make-permission';
import { faker } from '@faker-js/faker';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Grant Direct Permission (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should grant direct permission with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const permission = await makePermission();

    const createUserUseCase = makeCreateUserUseCase();
    const uniqueId = faker.string.uuid().slice(0, 8);
    const { user } = await createUserUseCase.execute({
      email: `user-${uniqueId}@${faker.internet.domainName()}`,
      password: 'Pass@123',
      username: `user${uniqueId}`,
    });

    const response = await request(app.server)
      .post(`/v1/rbac/users/${user.id.toString()}/direct-permissions`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        permissionId: permission.id.toString(),
      });

    expect(response.statusCode).toEqual(201);
    expect(response.body).toHaveProperty('success', true);
  });
});

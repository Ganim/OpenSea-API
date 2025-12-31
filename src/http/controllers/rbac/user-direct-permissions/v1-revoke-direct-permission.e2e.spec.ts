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

  it('should allow ADMIN to REVOKE direct permission from user', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const permission = await makePermission();

    const createUserUseCase = makeCreateUserUseCase();
    const uniqueId = faker.string.uuid().slice(0, 8);
    const { user } = await createUserUseCase.execute({
      email: `user-${uniqueId}@${faker.internet.domainName()}`,
      password: 'Pass@123',
      username: `user${uniqueId}`, });

    // Grant permission first
    await makeUserDirectPermission({
      userId: user.id.toString(),
      permissionId: permission.id.toString(),
    });

    // Revoke permission
    const response = await request(app.server)
      .delete(
        `/v1/rbac/users/${user.id.toString()}/direct-permissions/${permission.id.toString()}`,
      )
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(204);
  });

  it('should return 404 when trying to REVOKE non-existent permission', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const permission = await makePermission();

    const createUserUseCase = makeCreateUserUseCase();
    const uniqueId = faker.string.uuid().slice(0, 8);
    const { user } = await createUserUseCase.execute({
      email: `user-${uniqueId}@${faker.internet.domainName()}`,
      password: 'Pass@123',
      username: `user${uniqueId}`, });

    // Try to revoke without granting
    const response = await request(app.server)
      .delete(
        `/v1/rbac/users/${user.id.toString()}/direct-permissions/${permission.id.toString()}`,
      )
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(404);
  });

  it('should NOT allow user without permission to revoke permissions', async () => {
    const { token: _adminToken } = await createAndAuthenticateUser(
      app,
    );
    const { token: userToken } = await createAndAuthenticateUser(app, );
    const permission = await makePermission();

    const createUserUseCase = makeCreateUserUseCase();
    const uniqueId = faker.string.uuid().slice(0, 8);
    const { user } = await createUserUseCase.execute({
      email: `user-${uniqueId}@${faker.internet.domainName()}`,
      password: 'Pass@123',
      username: `user${uniqueId}`, });

    // Grant permission as admin
    await makeUserDirectPermission({
      userId: user.id.toString(),
      permissionId: permission.id.toString(),
    });

    // Try to revoke as regular user
    const response = await request(app.server)
      .delete(
        `/v1/rbac/users/${user.id.toString()}/direct-permissions/${permission.id.toString()}`,
      )
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.statusCode).toEqual(403);
  });

  it('should return 404 for NON-EXISTENT user', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const permission = await makePermission();

    const response = await request(app.server)
      .delete(
        `/v1/rbac/users/00000000-0000-0000-0000-000000000000/direct-permissions/${permission.id.toString()}`,
      )
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(404);
  });

  it('should return 404 for NON-EXISTENT permission', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const createUserUseCase = makeCreateUserUseCase();
    const uniqueId = faker.string.uuid().slice(0, 8);
    const { user } = await createUserUseCase.execute({
      email: `user-${uniqueId}@${faker.internet.domainName()}`,
      password: 'Pass@123',
      username: `user${uniqueId}`, });

    const response = await request(app.server)
      .delete(
        `/v1/rbac/users/${user.id.toString()}/direct-permissions/00000000-0000-0000-0000-000000000000`,
      )
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(404);
  });

  it('should NOT allow unauthenticated request', async () => {
    const permission = await makePermission();

    const createUserUseCase = makeCreateUserUseCase();
    const uniqueId = faker.string.uuid().slice(0, 8);
    const { user } = await createUserUseCase.execute({
      email: `user-${uniqueId}@${faker.internet.domainName()}`,
      password: 'Pass@123',
      username: `user${uniqueId}`, });

    const response = await request(app.server).delete(
      `/v1/rbac/users/${user.id.toString()}/direct-permissions/${permission.id.toString()}`,
    );

    expect(response.statusCode).toEqual(401);
  });
});

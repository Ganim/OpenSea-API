import { app } from '@/app';
import { makeCreateUserUseCase } from '@/use-cases/core/users/factories/make-create-user-use-case';
import { makeAssignGroupToUserUseCase } from '@/use-cases/rbac/associations/factories/make-assign-group-to-user-use-case';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { makePermissionGroup } from '@/utils/tests/factories/rbac/make-permission-group';
import { faker } from '@faker-js/faker';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Remove Group From User (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow ADMIN to REMOVE group from user', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const group = await makePermissionGroup();

    const createUserUseCase = makeCreateUserUseCase();
    const { user } = await createUserUseCase.execute({
      email: faker.internet.email(),
      password: 'Pass@123',
      username: `user${faker.string.uuid().slice(0, 8)}`, });

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

  it('should NOT allow user without permission to remove groups', async () => {
    const { token } = await createAndAuthenticateUser(app, );
    const group = await makePermissionGroup();

    const createUserUseCase = makeCreateUserUseCase();
    const { user } = await createUserUseCase.execute({
      email: faker.internet.email(),
      password: 'Pass@123',
      username: `user${faker.string.uuid().slice(0, 8)}`, });

    const response = await request(app.server)
      .delete(
        `/v1/rbac/users/${user.id.toString()}/groups/${group.id.toString()}`,
      )
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(403);
  });

  it('should return 404 for NON-EXISTENT user', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const group = await makePermissionGroup();

    const response = await request(app.server)
      .delete(
        `/v1/rbac/users/00000000-0000-0000-0000-000000000000/groups/${group.id.toString()}`,
      )
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(404);
  });

  it('should NOT allow unauthenticated request', async () => {
    const group = await makePermissionGroup();

    const createUserUseCase = makeCreateUserUseCase();
    const { user } = await createUserUseCase.execute({
      email: faker.internet.email(),
      password: 'Pass@123',
      username: `user${faker.string.uuid().slice(0, 8)}`, });

    const response = await request(app.server).delete(
      `/v1/rbac/users/${user.id.toString()}/groups/${group.id.toString()}`,
    );

    expect(response.statusCode).toEqual(401);
  });
});

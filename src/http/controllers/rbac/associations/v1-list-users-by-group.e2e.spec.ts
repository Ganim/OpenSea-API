import { app } from '@/app';
import { makeCreateUserUseCase } from '@/use-cases/core/users/factories/make-create-user-use-case';
import { makeAssignGroupToUserUseCase } from '@/use-cases/rbac/associations/factories/make-assign-group-to-user-use-case';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { makePermissionGroup } from '@/utils/tests/factories/rbac/make-permission-group';
import { faker } from '@faker-js/faker';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('List Users By Group (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow ADMIN to LIST users in group', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const group = await makePermissionGroup();

    const createUserUseCase = makeCreateUserUseCase();
    const { user: user1 } = await createUserUseCase.execute({
      email: faker.internet.email(),
      password: 'Pass@123',
      username: `user${faker.string.uuid().slice(0, 8)}`, });
    const { user: user2 } = await createUserUseCase.execute({
      email: faker.internet.email(),
      password: 'Pass@123',
      username: `user${faker.string.uuid().slice(0, 8)}`, });

    const assignGroupUseCase = makeAssignGroupToUserUseCase();
    await assignGroupUseCase.execute({
      userId: user1.id.toString(),
      groupId: group.id.toString(),
      grantedBy: null,
      expiresAt: null,
    });
    await assignGroupUseCase.execute({
      userId: user2.id.toString(),
      groupId: group.id.toString(),
      grantedBy: null,
      expiresAt: null,
    });

    const response = await request(app.server)
      .get(`/v1/rbac/permission-groups/${group.id.toString()}/users`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      userIds: expect.arrayContaining([
        user1.id.toString(),
        user2.id.toString(),
      ]),
    });
  });

  it('should return EMPTY array for group with no users', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const group = await makePermissionGroup();

    const response = await request(app.server)
      .get(`/v1/rbac/permission-groups/${group.id.toString()}/users`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body.userIds).toEqual([]);
  });

  it('should support PAGINATION', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const group = await makePermissionGroup();

    const response = await request(app.server)
      .get(`/v1/rbac/permission-groups/${group.id.toString()}/users`)
      .set('Authorization', `Bearer ${token}`)
      .query({ page: '1', limit: '10' });

    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty('userIds');
    expect(Array.isArray(response.body.userIds)).toBe(true);
  });

  it('should NOT allow user without permission to list users by group', async () => {
    const { token } = await createAndAuthenticateUser(app, );
    const group = await makePermissionGroup();

    const response = await request(app.server)
      .get(`/v1/rbac/permission-groups/${group.id.toString()}/users`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(403);
  });

  it('should return 404 for NON-EXISTENT group', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .get(
        '/v1/rbac/permission-groups/00000000-0000-0000-0000-000000000000/users',
      )
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(404);
  });

  it('should NOT allow unauthenticated request', async () => {
    const group = await makePermissionGroup();

    const response = await request(app.server).get(
      `/v1/rbac/permission-groups/${group.id.toString()}/users`,
    );

    expect(response.statusCode).toEqual(401);
  });
});

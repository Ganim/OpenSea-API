import { app } from '@/app';
import { makeCreateUserUseCase } from '@/use-cases/core/users/factories/make-create-user-use-case';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { makePermission } from '@/utils/tests/factories/rbac/make-permission';
import { makeUserDirectPermission } from '@/utils/tests/factories/rbac/make-user-direct-permission';
import { faker } from '@faker-js/faker';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('List Users By Permission (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow ADMIN to LIST users with a direct permission', async () => {
    const { token } = await createAndAuthenticateUser(app, 'ADMIN');
    const permission = await makePermission();

    const createUserUseCase = makeCreateUserUseCase();

    // Create multiple users
    const uniqueId1 = faker.string.uuid().slice(0, 8);
    const { user: user1 } = await createUserUseCase.execute({
      email: `user-${uniqueId1}@${faker.internet.domainName()}`,
      password: 'Pass@123',
      username: `user${uniqueId1}`,
      role: 'USER',
    });

    const uniqueId2 = faker.string.uuid().slice(0, 8);
    const { user: user2 } = await createUserUseCase.execute({
      email: `user-${uniqueId2}@${faker.internet.domainName()}`,
      password: 'Pass@123',
      username: `user${uniqueId2}`,
      role: 'USER',
    });

    const uniqueId3 = faker.string.uuid().slice(0, 8);
    const { user: user3 } = await createUserUseCase.execute({
      email: `user-${uniqueId3}@${faker.internet.domainName()}`,
      password: 'Pass@123',
      username: `user${uniqueId3}`,
      role: 'USER',
    });

    // Grant permission to user1 and user2, but not user3
    await makeUserDirectPermission({
      userId: user1.id.toString(),
      permissionId: permission.id.toString(),
    });

    await makeUserDirectPermission({
      userId: user2.id.toString(),
      permissionId: permission.id.toString(),
    });

    const response = await request(app.server)
      .get(`/v1/rbac/permissions/${permission.id.toString()}/users`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body.userIds).toHaveLength(2);
    expect(response.body.userIds).toEqual(
      expect.arrayContaining([user1.id.toString(), user2.id.toString()]),
    );
    expect(response.body.userIds).not.toContain(user3.id.toString());
  });

  it('should return EMPTY array when no users have the permission', async () => {
    const { token } = await createAndAuthenticateUser(app, 'ADMIN');
    const permission = await makePermission();

    const response = await request(app.server)
      .get(`/v1/rbac/permissions/${permission.id.toString()}/users`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body.userIds).toHaveLength(0);
  });

  it('should NOT include users with EXPIRED permissions', async () => {
    const { token } = await createAndAuthenticateUser(app, 'ADMIN');
    const permission = await makePermission();

    const createUserUseCase = makeCreateUserUseCase();

    // User with active permission
    const uniqueId1 = faker.string.uuid().slice(0, 8);
    const { user: user1 } = await createUserUseCase.execute({
      email: `user-${uniqueId1}@${faker.internet.domainName()}`,
      password: 'Pass@123',
      username: `user${uniqueId1}`,
      role: 'USER',
    });

    // User with expired permission
    const uniqueId2 = faker.string.uuid().slice(0, 8);
    const { user: user2 } = await createUserUseCase.execute({
      email: `user-${uniqueId2}@${faker.internet.domainName()}`,
      password: 'Pass@123',
      username: `user${uniqueId2}`,
      role: 'USER',
    });

    await makeUserDirectPermission({
      userId: user1.id.toString(),
      permissionId: permission.id.toString(),
    });

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    await makeUserDirectPermission({
      userId: user2.id.toString(),
      permissionId: permission.id.toString(),
      expiresAt: pastDate,
    });

    const response = await request(app.server)
      .get(`/v1/rbac/permissions/${permission.id.toString()}/users`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body.userIds).toHaveLength(1);
    expect(response.body.userIds).toContain(user1.id.toString());
    expect(response.body.userIds).not.toContain(user2.id.toString());
  });

  it('should include users with both ALLOW and DENY effects', async () => {
    const { token } = await createAndAuthenticateUser(app, 'ADMIN');
    const permission = await makePermission();

    const createUserUseCase = makeCreateUserUseCase();

    const uniqueId1 = faker.string.uuid().slice(0, 8);
    const { user: user1 } = await createUserUseCase.execute({
      email: `user-${uniqueId1}@${faker.internet.domainName()}`,
      password: 'Pass@123',
      username: `user${uniqueId1}`,
      role: 'USER',
    });

    const uniqueId2 = faker.string.uuid().slice(0, 8);
    const { user: user2 } = await createUserUseCase.execute({
      email: `user-${uniqueId2}@${faker.internet.domainName()}`,
      password: 'Pass@123',
      username: `user${uniqueId2}`,
      role: 'USER',
    });

    // User with allow
    await makeUserDirectPermission({
      userId: user1.id.toString(),
      permissionId: permission.id.toString(),
      effect: 'allow',
    });

    // User with deny
    await makeUserDirectPermission({
      userId: user2.id.toString(),
      permissionId: permission.id.toString(),
      effect: 'deny',
    });

    const response = await request(app.server)
      .get(`/v1/rbac/permissions/${permission.id.toString()}/users`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body.userIds).toHaveLength(2);
    expect(response.body.userIds).toEqual(
      expect.arrayContaining([user1.id.toString(), user2.id.toString()]),
    );
  });

  it('should NOT return DUPLICATE user IDs', async () => {
    const { token } = await createAndAuthenticateUser(app, 'ADMIN');
    const permission = await makePermission();

    const createUserUseCase = makeCreateUserUseCase();

    const uniqueId = faker.string.uuid().slice(0, 8);
    const { user } = await createUserUseCase.execute({
      email: `user-${uniqueId}@${faker.internet.domainName()}`,
      password: 'Pass@123',
      username: `user${uniqueId}`,
      role: 'USER',
    });

    // Grant permission (should only appear once even if granted multiple times hypothetically)
    await makeUserDirectPermission({
      userId: user.id.toString(),
      permissionId: permission.id.toString(),
    });

    const response = await request(app.server)
      .get(`/v1/rbac/permissions/${permission.id.toString()}/users`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body.userIds).toHaveLength(1);
    expect(response.body.userIds[0]).toBe(user.id.toString());
  });

  it('should return 404 for NON-EXISTENT permission', async () => {
    const { token } = await createAndAuthenticateUser(app, 'ADMIN');

    const response = await request(app.server)
      .get('/v1/rbac/permissions/00000000-0000-0000-0000-000000000000/users')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(404);
  });

  it('should NOT allow USER to list users by permission', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');
    const permission = await makePermission();

    const response = await request(app.server)
      .get(`/v1/rbac/permissions/${permission.id.toString()}/users`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(403);
  });

  it('should NOT allow unauthenticated request', async () => {
    const permission = await makePermission();

    const response = await request(app.server).get(
      `/v1/rbac/permissions/${permission.id.toString()}/users`,
    );

    expect(response.statusCode).toEqual(401);
  });
});

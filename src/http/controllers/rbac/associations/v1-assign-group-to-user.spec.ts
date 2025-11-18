import { app } from '@/app';
import { makeCreateUserUseCase } from '@/use-cases/core/users/factories/make-create-user-use-case';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { makePermissionGroup } from '@/utils/tests/factories/rbac/make-permission-group';
import { faker } from '@faker-js/faker';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Assign Group To User (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow ADMIN to ASSIGN group to user', async () => {
    const { token } = await createAndAuthenticateUser(app, 'ADMIN');
    const group = await makePermissionGroup();

    const createUserUseCase = makeCreateUserUseCase();
    const uniqueId = faker.string.uuid().slice(0, 8);
    const { user } = await createUserUseCase.execute({
      email: `user-${uniqueId}@${faker.internet.domainName()}`,
      password: 'Pass@123',
      username: `user${uniqueId}`,
      role: 'USER',
    });

    const response = await request(app.server)
      .post(`/v1/rbac/users/${user.id.toString()}/groups`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        groupId: group.id.toString(),
      });

    expect(response.statusCode).toEqual(201);
    expect(response.body).toEqual({
      success: true,
    });
  });

  it('should allow assigning with EXPIRATION date', async () => {
    const { token } = await createAndAuthenticateUser(app, 'ADMIN');
    const group = await makePermissionGroup();

    const createUserUseCase = makeCreateUserUseCase();
    const uniqueId = faker.string.uuid().slice(0, 8);
    const { user } = await createUserUseCase.execute({
      email: `user-${uniqueId}@${faker.internet.domainName()}`,
      password: 'Pass@123',
      username: `user${uniqueId}`,
      role: 'USER',
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const response = await request(app.server)
      .post(`/v1/rbac/users/${user.id.toString()}/groups`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        groupId: group.id.toString(),
        expiresAt: expiresAt.toISOString(),
      });

    expect(response.statusCode).toEqual(201);
  });

  it('should allow setting GRANTED BY', async () => {
    const { token, user: adminUser } = await createAndAuthenticateUser(
      app,
      'ADMIN',
    );
    const group = await makePermissionGroup();

    const createUserUseCase = makeCreateUserUseCase();
    const uniqueId = faker.string.uuid().slice(0, 8);
    const { user } = await createUserUseCase.execute({
      email: `user-${uniqueId}@${faker.internet.domainName()}`,
      password: 'Pass@123',
      username: `user${uniqueId}`,
      role: 'USER',
    });

    const response = await request(app.server)
      .post(`/v1/rbac/users/${user.id.toString()}/groups`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        groupId: group.id.toString(),
        grantedBy: adminUser.user.id.toString(),
      });

    expect(response.statusCode).toEqual(201);
  });

  it('should NOT allow USER to assign groups', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');
    const group = await makePermissionGroup();

    const createUserUseCase = makeCreateUserUseCase();
    const uniqueId = faker.string.uuid().slice(0, 8);
    const { user } = await createUserUseCase.execute({
      email: `user-${uniqueId}@${faker.internet.domainName()}`,
      password: 'Pass@123',
      username: `user${uniqueId}`,
      role: 'USER',
    });

    const response = await request(app.server)
      .post(`/v1/rbac/users/${user.id.toString()}/groups`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        groupId: group.id.toString(),
      });

    expect(response.statusCode).toEqual(403);
  });

  it('should return 404 for NON-EXISTENT user', async () => {
    const { token } = await createAndAuthenticateUser(app, 'ADMIN');
    const group = await makePermissionGroup();

    const response = await request(app.server)
      .post('/v1/rbac/users/00000000-0000-0000-0000-000000000000/groups')
      .set('Authorization', `Bearer ${token}`)
      .send({
        groupId: group.id.toString(),
      });

    expect(response.statusCode).toEqual(404);
  });

  it('should return 404 for NON-EXISTENT group', async () => {
    const { token } = await createAndAuthenticateUser(app, 'ADMIN');

    const createUserUseCase = makeCreateUserUseCase();
    const uniqueId = faker.string.uuid().slice(0, 8);
    const { user } = await createUserUseCase.execute({
      email: `user-${uniqueId}@${faker.internet.domainName()}`,
      password: 'Pass@123',
      username: `user${uniqueId}`,
      role: 'USER',
    });

    const response = await request(app.server)
      .post(`/v1/rbac/users/${user.id.toString()}/groups`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        groupId: '00000000-0000-0000-0000-000000000000',
      });

    expect(response.statusCode).toEqual(404);
  });

  it('should NOT allow unauthenticated request', async () => {
    const group = await makePermissionGroup();

    const createUserUseCase = makeCreateUserUseCase();
    const uniqueId = faker.string.uuid().slice(0, 8);
    const { user } = await createUserUseCase.execute({
      email: `user-${uniqueId}@${faker.internet.domainName()}`,
      password: 'Pass@123',
      username: `user${uniqueId}`,
      role: 'USER',
    });

    const response = await request(app.server)
      .post(`/v1/rbac/users/${user.id.toString()}/groups`)
      .send({
        groupId: group.id.toString(),
      });

    expect(response.statusCode).toEqual(401);
  });
});

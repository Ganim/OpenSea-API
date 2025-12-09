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

  it('should allow ADMIN to GRANT direct permission to user', async () => {
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

    const response = await request(app.server)
      .post(`/v1/rbac/users/${user.id.toString()}/direct-permissions`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        permissionId: permission.id.toString(),
      });

    expect(response.statusCode).toEqual(201);
    expect(response.body).toEqual({
      success: true,
    });
  });

  it('should allow granting with DENY effect', async () => {
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

    const response = await request(app.server)
      .post(`/v1/rbac/users/${user.id.toString()}/direct-permissions`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        permissionId: permission.id.toString(),
        effect: 'deny',
      });

    expect(response.statusCode).toEqual(201);
    expect(response.body).toEqual({
      success: true,
    });
  });

  it('should allow granting with EXPIRATION date', async () => {
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

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const response = await request(app.server)
      .post(`/v1/rbac/users/${user.id.toString()}/direct-permissions`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        permissionId: permission.id.toString(),
        expiresAt: expiresAt.toISOString(),
      });

    expect(response.statusCode).toEqual(201);
  });

  it('should allow granting with CONDITIONS', async () => {
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

    const response = await request(app.server)
      .post(`/v1/rbac/users/${user.id.toString()}/direct-permissions`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        permissionId: permission.id.toString(),
        conditions: {
          maxAmount: 1000,
          currency: 'BRL',
        },
      });

    expect(response.statusCode).toEqual(201);
  });

  it('should allow setting GRANTED BY', async () => {
    const { token, user: adminUser } = await createAndAuthenticateUser(
      app,
      'ADMIN',
    );
    const permission = await makePermission();

    const createUserUseCase = makeCreateUserUseCase();
    const uniqueId = faker.string.uuid().slice(0, 8);
    const { user } = await createUserUseCase.execute({
      email: `user-${uniqueId}@${faker.internet.domainName()}`,
      password: 'Pass@123',
      username: `user${uniqueId}`,
      role: 'USER',
    });

    const response = await request(app.server)
      .post(`/v1/rbac/users/${user.id.toString()}/direct-permissions`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        permissionId: permission.id.toString(),
        grantedBy: adminUser.user.id.toString(),
      });

    expect(response.statusCode).toEqual(201);
  });

  it('should return 400 when permission is ALREADY ASSIGNED', async () => {
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

    // First grant
    await request(app.server)
      .post(`/v1/rbac/users/${user.id.toString()}/direct-permissions`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        permissionId: permission.id.toString(),
      });

    // Duplicate grant
    const response = await request(app.server)
      .post(`/v1/rbac/users/${user.id.toString()}/direct-permissions`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        permissionId: permission.id.toString(),
      });

    expect(response.statusCode).toEqual(400);
  });

  it('should NOT allow USER to grant permissions', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');
    const permission = await makePermission();

    const createUserUseCase = makeCreateUserUseCase();
    const uniqueId = faker.string.uuid().slice(0, 8);
    const { user } = await createUserUseCase.execute({
      email: `user-${uniqueId}@${faker.internet.domainName()}`,
      password: 'Pass@123',
      username: `user${uniqueId}`,
      role: 'USER',
    });

    const response = await request(app.server)
      .post(`/v1/rbac/users/${user.id.toString()}/direct-permissions`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        permissionId: permission.id.toString(),
      });

    expect(response.statusCode).toEqual(403);
  });

  it('should return 404 for NON-EXISTENT user', async () => {
    const { token } = await createAndAuthenticateUser(app, 'ADMIN');
    const permission = await makePermission();

    const response = await request(app.server)
      .post('/v1/rbac/users/00000000-0000-0000-0000-000000000000/direct-permissions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        permissionId: permission.id.toString(),
      });

    expect(response.statusCode).toEqual(404);
  });

  it('should return 404 for NON-EXISTENT permission', async () => {
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
      .post(`/v1/rbac/users/${user.id.toString()}/direct-permissions`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        permissionId: '00000000-0000-0000-0000-000000000000',
      });

    expect(response.statusCode).toEqual(404);
  });

  it('should NOT allow unauthenticated request', async () => {
    const permission = await makePermission();

    const createUserUseCase = makeCreateUserUseCase();
    const uniqueId = faker.string.uuid().slice(0, 8);
    const { user } = await createUserUseCase.execute({
      email: `user-${uniqueId}@${faker.internet.domainName()}`,
      password: 'Pass@123',
      username: `user${uniqueId}`,
      role: 'USER',
    });

    const response = await request(app.server)
      .post(`/v1/rbac/users/${user.id.toString()}/direct-permissions`)
      .send({
        permissionId: permission.id.toString(),
      });

    expect(response.statusCode).toEqual(401);
  });
});

import { app } from '@/app';
import { makeCreateUserUseCase } from '@/use-cases/core/users/factories/make-create-user-use-case';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { makePermission } from '@/utils/tests/factories/rbac/make-permission';
import { makeUserDirectPermission } from '@/utils/tests/factories/rbac/make-user-direct-permission';
import { faker } from '@faker-js/faker';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Update Direct Permission (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow ADMIN to UPDATE direct permission EFFECT', async () => {
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

    // Grant permission
    const directPermission = await makeUserDirectPermission({
      userId: user.id.toString(),
      permissionId: permission.id.toString(),
      effect: 'allow',
    });

    // Update effect to deny
    const response = await request(app.server)
      .patch(`/v1/rbac/users/direct-permissions/${directPermission.id.toString()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        effect: 'deny',
      });

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      success: true,
    });
  });

  it('should allow updating EXPIRATION date', async () => {
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

    // Grant permission without expiration
    const directPermission = await makeUserDirectPermission({
      userId: user.id.toString(),
      permissionId: permission.id.toString(),
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const response = await request(app.server)
      .patch(`/v1/rbac/users/direct-permissions/${directPermission.id.toString()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        expiresAt: expiresAt.toISOString(),
      });

    expect(response.statusCode).toEqual(200);
  });

  it('should allow updating CONDITIONS', async () => {
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

    const directPermission = await makeUserDirectPermission({
      userId: user.id.toString(),
      permissionId: permission.id.toString(),
      conditions: { maxAmount: 500 },
    });

    const response = await request(app.server)
      .patch(`/v1/rbac/users/direct-permissions/${directPermission.id.toString()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        conditions: {
          maxAmount: 1000,
          currency: 'BRL',
        },
      });

    expect(response.statusCode).toEqual(200);
  });

  it('should allow REMOVING expiration by setting to null', async () => {
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

    const directPermission = await makeUserDirectPermission({
      userId: user.id.toString(),
      permissionId: permission.id.toString(),
      expiresAt,
    });

    const response = await request(app.server)
      .patch(`/v1/rbac/users/direct-permissions/${directPermission.id.toString()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        expiresAt: null,
      });

    expect(response.statusCode).toEqual(200);
  });

  it('should return 404 for NON-EXISTENT direct permission', async () => {
    const { token } = await createAndAuthenticateUser(app, 'ADMIN');

    const response = await request(app.server)
      .patch('/v1/rbac/users/direct-permissions/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({
        effect: 'deny',
      });

    expect(response.statusCode).toEqual(404);
  });

  it('should NOT allow USER to update permissions', async () => {
    const { token: adminToken } = await createAndAuthenticateUser(app, 'ADMIN');
    const { token: userToken } = await createAndAuthenticateUser(app, 'USER');
    const permission = await makePermission();

    const createUserUseCase = makeCreateUserUseCase();
    const uniqueId = faker.string.uuid().slice(0, 8);
    const { user } = await createUserUseCase.execute({
      email: `user-${uniqueId}@${faker.internet.domainName()}`,
      password: 'Pass@123',
      username: `user${uniqueId}`,
      role: 'USER',
    });

    const directPermission = await makeUserDirectPermission({
      userId: user.id.toString(),
      permissionId: permission.id.toString(),
    });

    const response = await request(app.server)
      .patch(`/v1/rbac/users/direct-permissions/${directPermission.id.toString()}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        effect: 'deny',
      });

    expect(response.statusCode).toEqual(403);
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

    const directPermission = await makeUserDirectPermission({
      userId: user.id.toString(),
      permissionId: permission.id.toString(),
    });

    const response = await request(app.server)
      .patch(`/v1/rbac/users/direct-permissions/${directPermission.id.toString()}`)
      .send({
        effect: 'deny',
      });

    expect(response.statusCode).toEqual(401);
  });
});

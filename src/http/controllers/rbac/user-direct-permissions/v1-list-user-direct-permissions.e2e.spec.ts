import { app } from '@/app';
import { makeCreateUserUseCase } from '@/use-cases/core/users/factories/make-create-user-use-case';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { makePermission } from '@/utils/tests/factories/rbac/make-permission';
import { makeUserDirectPermission } from '@/utils/tests/factories/rbac/make-user-direct-permission';
import { faker } from '@faker-js/faker';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('List User Direct Permissions (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow authenticated user to LIST their direct permissions', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const permission1 = await makePermission();
    const permission2 = await makePermission();

    const createUserUseCase = makeCreateUserUseCase();
    const uniqueId = faker.string.uuid().slice(0, 8);
    const { user } = await createUserUseCase.execute({
      email: `user-${uniqueId}@${faker.internet.domainName()}`,
      password: 'Pass@123',
      username: `user${uniqueId}`, });

    // Grant permissions
    await makeUserDirectPermission({
      userId: user.id.toString(),
      permissionId: permission1.id.toString(),
      effect: 'allow',
    });

    await makeUserDirectPermission({
      userId: user.id.toString(),
      permissionId: permission2.id.toString(),
      effect: 'deny',
    });

    const response = await request(app.server)
      .get(`/v1/rbac/users/${user.id.toString()}/direct-permissions`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body.permissions).toHaveLength(2);
    expect(response.body.permissions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: permission1.id.toString(),
          effect: 'allow',
        }),
        expect.objectContaining({
          id: permission2.id.toString(),
          effect: 'deny',
        }),
      ]),
    );
  });

  it('should filter by EFFECT (allow)', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const permission1 = await makePermission();
    const permission2 = await makePermission();

    const createUserUseCase = makeCreateUserUseCase();
    const uniqueId = faker.string.uuid().slice(0, 8);
    const { user } = await createUserUseCase.execute({
      email: `user-${uniqueId}@${faker.internet.domainName()}`,
      password: 'Pass@123',
      username: `user${uniqueId}`, });

    await makeUserDirectPermission({
      userId: user.id.toString(),
      permissionId: permission1.id.toString(),
      effect: 'allow',
    });

    await makeUserDirectPermission({
      userId: user.id.toString(),
      permissionId: permission2.id.toString(),
      effect: 'deny',
    });

    const response = await request(app.server)
      .get(
        `/v1/rbac/users/${user.id.toString()}/direct-permissions?effect=allow`,
      )
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body.permissions).toHaveLength(1);
    expect(response.body.permissions[0]).toMatchObject({
      id: permission1.id.toString(),
      effect: 'allow',
    });
  });

  it('should filter by EFFECT (deny)', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const permission1 = await makePermission();
    const permission2 = await makePermission();

    const createUserUseCase = makeCreateUserUseCase();
    const uniqueId = faker.string.uuid().slice(0, 8);
    const { user } = await createUserUseCase.execute({
      email: `user-${uniqueId}@${faker.internet.domainName()}`,
      password: 'Pass@123',
      username: `user${uniqueId}`, });

    await makeUserDirectPermission({
      userId: user.id.toString(),
      permissionId: permission1.id.toString(),
      effect: 'allow',
    });

    await makeUserDirectPermission({
      userId: user.id.toString(),
      permissionId: permission2.id.toString(),
      effect: 'deny',
    });

    const response = await request(app.server)
      .get(
        `/v1/rbac/users/${user.id.toString()}/direct-permissions?effect=deny`,
      )
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body.permissions).toHaveLength(1);
    expect(response.body.permissions[0]).toMatchObject({
      id: permission2.id.toString(),
      effect: 'deny',
    });
  });

  it('should NOT include EXPIRED permissions by default', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const permission1 = await makePermission();
    const permission2 = await makePermission();

    const createUserUseCase = makeCreateUserUseCase();
    const uniqueId = faker.string.uuid().slice(0, 8);
    const { user } = await createUserUseCase.execute({
      email: `user-${uniqueId}@${faker.internet.domainName()}`,
      password: 'Pass@123',
      username: `user${uniqueId}`, });

    // Active permission
    await makeUserDirectPermission({
      userId: user.id.toString(),
      permissionId: permission1.id.toString(),
    });

    // Expired permission
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    await makeUserDirectPermission({
      userId: user.id.toString(),
      permissionId: permission2.id.toString(),
      expiresAt: pastDate,
    });

    const response = await request(app.server)
      .get(`/v1/rbac/users/${user.id.toString()}/direct-permissions`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body.permissions).toHaveLength(1);
    expect(response.body.permissions[0]).toMatchObject({
      id: permission1.id.toString(),
    });
  });

  it('should include EXPIRED permissions when requested', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const permission1 = await makePermission();
    const permission2 = await makePermission();

    const createUserUseCase = makeCreateUserUseCase();
    const uniqueId = faker.string.uuid().slice(0, 8);
    const { user } = await createUserUseCase.execute({
      email: `user-${uniqueId}@${faker.internet.domainName()}`,
      password: 'Pass@123',
      username: `user${uniqueId}`, });

    // Active permission
    await makeUserDirectPermission({
      userId: user.id.toString(),
      permissionId: permission1.id.toString(),
    });

    // Expired permission
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    await makeUserDirectPermission({
      userId: user.id.toString(),
      permissionId: permission2.id.toString(),
      expiresAt: pastDate,
    });

    const response = await request(app.server)
      .get(
        `/v1/rbac/users/${user.id.toString()}/direct-permissions?includeExpired=true`,
      )
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body.permissions).toHaveLength(2);
  });

  it('should include CONDITIONS in response', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const permission = await makePermission();

    const createUserUseCase = makeCreateUserUseCase();
    const uniqueId = faker.string.uuid().slice(0, 8);
    const { user } = await createUserUseCase.execute({
      email: `user-${uniqueId}@${faker.internet.domainName()}`,
      password: 'Pass@123',
      username: `user${uniqueId}`, });

    const conditions = {
      maxAmount: 1000,
      currency: 'BRL',
    };

    await makeUserDirectPermission({
      userId: user.id.toString(),
      permissionId: permission.id.toString(),
      conditions,
    });

    const response = await request(app.server)
      .get(`/v1/rbac/users/${user.id.toString()}/direct-permissions`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body.permissions).toHaveLength(1);
    expect(response.body.permissions[0]).toMatchObject({
      conditions,
    });
  });

  it('should return EMPTY array when user has no permissions', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const createUserUseCase = makeCreateUserUseCase();
    const uniqueId = faker.string.uuid().slice(0, 8);
    const { user } = await createUserUseCase.execute({
      email: `user-${uniqueId}@${faker.internet.domainName()}`,
      password: 'Pass@123',
      username: `user${uniqueId}`, });

    const response = await request(app.server)
      .get(`/v1/rbac/users/${user.id.toString()}/direct-permissions`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body.permissions).toHaveLength(0);
  });

  it('should return 404 for NON-EXISTENT user', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .get(
        '/v1/rbac/users/00000000-0000-0000-0000-000000000000/direct-permissions',
      )
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(404);
  });

  it('should NOT allow unauthenticated request', async () => {
    const createUserUseCase = makeCreateUserUseCase();
    const uniqueId = faker.string.uuid().slice(0, 8);
    const { user } = await createUserUseCase.execute({
      email: `user-${uniqueId}@${faker.internet.domainName()}`,
      password: 'Pass@123',
      username: `user${uniqueId}`, });

    const response = await request(app.server).get(
      `/v1/rbac/users/${user.id.toString()}/direct-permissions`,
    );

    expect(response.statusCode).toEqual(401);
  });
});

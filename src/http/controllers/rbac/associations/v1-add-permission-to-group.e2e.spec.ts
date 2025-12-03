import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { makePermission } from '@/utils/tests/factories/rbac/make-permission';
import { makePermissionGroup } from '@/utils/tests/factories/rbac/make-permission-group';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Add Permission To Group (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow ADMIN to ADD permission to group', async () => {
    const { token } = await createAndAuthenticateUser(app, 'ADMIN');
    const group = await makePermissionGroup();
    const permission = await makePermission();

    const response = await request(app.server)
      .post(`/v1/rbac/permission-groups/${group.id.toString()}/permissions`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        permissionCode: permission.code.value,
        effect: 'allow',
      });

    expect(response.statusCode).toEqual(201);
    expect(response.body).toEqual({
      success: true,
    });
  });

  it('should allow adding permission with CONDITIONS', async () => {
    const { token } = await createAndAuthenticateUser(app, 'ADMIN');
    const group = await makePermissionGroup();
    const permission = await makePermission();

    const response = await request(app.server)
      .post(`/v1/rbac/permission-groups/${group.id.toString()}/permissions`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        permissionCode: permission.code.value,
        effect: 'allow',
        conditions: {
          department: 'sales',
          region: 'north',
        },
      });

    expect(response.statusCode).toEqual(201);
  });

  it('should allow DENY effect', async () => {
    const { token } = await createAndAuthenticateUser(app, 'ADMIN');
    const group = await makePermissionGroup();
    const permission = await makePermission();

    const response = await request(app.server)
      .post(`/v1/rbac/permission-groups/${group.id.toString()}/permissions`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        permissionCode: permission.code.value,
        effect: 'deny',
      });

    expect(response.statusCode).toEqual(201);
  });

  it('should NOT allow USER to add permission to group', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');
    const group = await makePermissionGroup();
    const permission = await makePermission();

    const response = await request(app.server)
      .post(`/v1/rbac/permission-groups/${group.id.toString()}/permissions`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        permissionCode: permission.code.value,
        effect: 'allow',
      });

    expect(response.statusCode).toEqual(403);
  });

  it('should return 404 for NON-EXISTENT group', async () => {
    const { token } = await createAndAuthenticateUser(app, 'ADMIN');
    const permission = await makePermission();

    const response = await request(app.server)
      .post(
        '/v1/rbac/permission-groups/00000000-0000-0000-0000-000000000000/permissions',
      )
      .set('Authorization', `Bearer ${token}`)
      .send({
        permissionCode: permission.code.value,
        effect: 'allow',
      });

    expect(response.statusCode).toEqual(404);
  });

  it('should return 404 for NON-EXISTENT permission', async () => {
    const { token } = await createAndAuthenticateUser(app, 'ADMIN');
    const group = await makePermissionGroup();

    const response = await request(app.server)
      .post(`/v1/rbac/permission-groups/${group.id.toString()}/permissions`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        permissionCode: 'nonexistent.permission.read',
        effect: 'allow',
      });

    expect(response.statusCode).toEqual(404);
  });

  it('should NOT allow unauthenticated request', async () => {
    const group = await makePermissionGroup();
    const permission = await makePermission();

    const response = await request(app.server)
      .post(`/v1/rbac/permission-groups/${group.id.toString()}/permissions`)
      .send({
        permissionCode: permission.code.value,
        effect: 'allow',
      });

    expect(response.statusCode).toEqual(401);
  });
});

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { makePermissionGroup } from '@/utils/tests/factories/rbac/make-permission-group';
import { faker } from '@faker-js/faker';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Update Permission Group (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow ADMIN to UPDATE a permission group', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const group = await makePermissionGroup();

    const updatedName = `Updated Group ${faker.string.uuid().slice(0, 8)}`;
    const response = await request(app.server)
      .patch(`/v1/rbac/permission-groups/${group.id.toString()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: updatedName,
        description: 'Updated description',
        color: '#00FF00',
      });

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      group: expect.objectContaining({
        id: group.id.toString(),
        name: updatedName,
        description: 'Updated description',
        color: '#00FF00',
      }),
    });
  });

  it('should allow partial UPDATE', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const group = await makePermissionGroup();

    const response = await request(app.server)
      .patch(`/v1/rbac/permission-groups/${group.id.toString()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        priority: 500,
      });

    expect(response.statusCode).toEqual(200);
    expect(response.body.group.priority).toBe(500);
  });

  it('should allow DEACTIVATING a group', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const group = await makePermissionGroup({ isActive: true });

    const response = await request(app.server)
      .patch(`/v1/rbac/permission-groups/${group.id.toString()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        isActive: false,
      });

    expect(response.statusCode).toEqual(200);
    expect(response.body.group.isActive).toBe(false);
  });

  it('should NOT allow user without permission to UPDATE a permission group', async () => {
    const { token } = await createAndAuthenticateUser(app, );
    const group = await makePermissionGroup();

    const response = await request(app.server)
      .patch(`/v1/rbac/permission-groups/${group.id.toString()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Should Not Update',
      });

    expect(response.statusCode).toEqual(403);
  });

  it('should return 404 for NON-EXISTENT group', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .patch('/v1/rbac/permission-groups/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Does Not Exist',
      });

    expect(response.statusCode).toEqual(404);
  });

  it('should NOT allow unauthenticated request', async () => {
    const group = await makePermissionGroup();

    const response = await request(app.server)
      .patch(`/v1/rbac/permission-groups/${group.id.toString()}`)
      .send({
        name: 'Unauthorized Update',
      });

    expect(response.statusCode).toEqual(401);
  });
});

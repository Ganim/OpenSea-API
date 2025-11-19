import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { makePermission } from '@/utils/tests/factories/rbac/make-permission';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Update Permission (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow ADMIN to UPDATE a permission', async () => {
    const { token } = await createAndAuthenticateUser(app, 'ADMIN');
    const permission = await makePermission();

    const response = await request(app.server)
      .patch(`/v1/rbac/permissions/${permission.id.toString()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Permission Name',
        description: 'Updated description',
      });

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      permission: expect.objectContaining({
        id: permission.id.toString(),
        name: 'Updated Permission Name',
        description: 'Updated description',
      }),
    });
  });

  it('should allow partial UPDATE', async () => {
    const { token } = await createAndAuthenticateUser(app, 'ADMIN');
    const permission = await makePermission();

    const response = await request(app.server)
      .patch(`/v1/rbac/permissions/${permission.id.toString()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Only Name Updated',
      });

    expect(response.statusCode).toEqual(200);
    expect(response.body.permission.name).toBe('Only Name Updated');
  });

  it('should NOT allow USER to UPDATE a permission', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');
    const permission = await makePermission();

    const response = await request(app.server)
      .patch(`/v1/rbac/permissions/${permission.id.toString()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Should Not Update',
      });

    expect(response.statusCode).toEqual(403);
  });

  it('should return 404 for NON-EXISTENT permission', async () => {
    const { token } = await createAndAuthenticateUser(app, 'ADMIN');

    const response = await request(app.server)
      .patch('/v1/rbac/permissions/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Does Not Exist',
      });

    expect(response.statusCode).toEqual(404);
  });

  it('should NOT allow unauthenticated request', async () => {
    const permission = await makePermission();

    const response = await request(app.server)
      .patch(`/v1/rbac/permissions/${permission.id.toString()}`)
      .send({
        name: 'Unauthorized Update',
      });

    expect(response.statusCode).toEqual(401);
  });
});

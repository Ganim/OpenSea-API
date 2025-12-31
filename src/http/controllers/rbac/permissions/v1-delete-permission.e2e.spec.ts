import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { makePermission } from '@/utils/tests/factories/rbac/make-permission';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Delete Permission (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow ADMIN to DELETE a permission', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const permission = await makePermission();

    const response = await request(app.server)
      .delete(`/v1/rbac/permissions/${permission.id.toString()}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(204);
  });

  it('should NOT delete SYSTEM permissions', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const systemPermission = await makePermission({ isSystem: true });

    const response = await request(app.server)
      .delete(`/v1/rbac/permissions/${systemPermission.id.toString()}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(400);
    expect(response.body.message).toContain('system');
  });

  it('should NOT allow user without permission to DELETE a permission', async () => {
    const { token } = await createAndAuthenticateUser(app, );
    const permission = await makePermission();

    const response = await request(app.server)
      .delete(`/v1/rbac/permissions/${permission.id.toString()}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(403);
  });

  it('should return 404 for NON-EXISTENT permission', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .delete('/v1/rbac/permissions/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(404);
  });

  it('should NOT allow unauthenticated request', async () => {
    const permission = await makePermission();

    const response = await request(app.server).delete(
      `/v1/rbac/permissions/${permission.id.toString()}`,
    );

    expect(response.statusCode).toEqual(401);
  });
});

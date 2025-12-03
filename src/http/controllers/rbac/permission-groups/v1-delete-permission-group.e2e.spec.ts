import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { makePermissionGroup } from '@/utils/tests/factories/rbac/make-permission-group';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Delete Permission Group (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow ADMIN to soft DELETE a permission group', async () => {
    const { token } = await createAndAuthenticateUser(app, 'ADMIN');
    const group = await makePermissionGroup();

    const response = await request(app.server)
      .delete(`/v1/rbac/permission-groups/${group.id.toString()}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(204);
  });

  it('should allow FORCE delete with query param', async () => {
    const { token } = await createAndAuthenticateUser(app, 'ADMIN');
    const group = await makePermissionGroup();

    const response = await request(app.server)
      .delete(`/v1/rbac/permission-groups/${group.id.toString()}`)
      .query({ force: true })
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(204);
  });

  it('should NOT delete SYSTEM groups', async () => {
    const { token } = await createAndAuthenticateUser(app, 'ADMIN');
    const systemGroup = await makePermissionGroup({ isSystem: true });

    const response = await request(app.server)
      .delete(`/v1/rbac/permission-groups/${systemGroup.id.toString()}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(400);
    expect(response.body.message).toContain('system');
  });

  it('should NOT allow USER to DELETE a permission group', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');
    const group = await makePermissionGroup();

    const response = await request(app.server)
      .delete(`/v1/rbac/permission-groups/${group.id.toString()}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(403);
  });

  it('should return 404 for NON-EXISTENT group', async () => {
    const { token } = await createAndAuthenticateUser(app, 'ADMIN');

    const response = await request(app.server)
      .delete('/v1/rbac/permission-groups/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(404);
  });

  it('should NOT allow unauthenticated request', async () => {
    const group = await makePermissionGroup();

    const response = await request(app.server).delete(
      `/v1/rbac/permission-groups/${group.id.toString()}`,
    );

    expect(response.statusCode).toEqual(401);
  });
});

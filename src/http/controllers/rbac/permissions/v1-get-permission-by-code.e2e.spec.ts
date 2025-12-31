import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { makePermission } from '@/utils/tests/factories/rbac/make-permission';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Get Permission By Code (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow authenticated USER to GET permission by CODE', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const permission = await makePermission({
      module: 'test',
      resource: 'example',
      action: 'read',
    });

    const response = await request(app.server)
      .get(`/v1/rbac/permissions/code/${permission.code}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body.permission).toEqual(
      expect.objectContaining({
        id: permission.id.toString(),
        code: permission.code.toString(),
        module: 'test',
        resource: expect.stringContaining('example'),
        action: 'read',
      }),
    );
  });

  it('should return 404 for NON-EXISTENT permission code', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .get('/v1/rbac/permissions/code/nonexistent.permission.read')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(404);
  });

  it('should NOT allow unauthenticated request', async () => {
    const permission = await makePermission({
      module: 'test',
      resource: 'auth',
      action: 'read',
    });

    const response = await request(app.server).get(
      `/v1/rbac/permissions/code/${permission.code}`,
    );

    expect(response.statusCode).toEqual(401);
  });
});

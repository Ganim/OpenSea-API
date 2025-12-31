import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { makePermission } from '@/utils/tests/factories/rbac/make-permission';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Get Permission By ID (e2e)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow authenticated USER to GET permission by ID', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const permission = await makePermission();

    const response = await request(app.server)
      .get(`/v1/rbac/permissions/${permission.id.toString()}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      permission: expect.objectContaining({
        id: permission.id.toString(),
        code: permission.code.value,
        name: permission.name,
        isSystem: permission.isSystem,
      }),
    });
  });

  it('should return 404 for NON-EXISTENT permission', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .get('/v1/rbac/permissions/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(404);
  });

  it('should NOT allow unauthenticated request', async () => {
    const permission = await makePermission();

    const response = await request(app.server).get(
      `/v1/rbac/permissions/${permission.id.toString()}`,
    );

    expect(response.statusCode).toEqual(401);
  });
});

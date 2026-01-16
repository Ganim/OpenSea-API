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

  it('should get permission by code with correct schema', async () => {
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
    expect(response.body).toHaveProperty('permission');
    expect(response.body.permission).toHaveProperty('id');
    expect(response.body.permission).toHaveProperty('code');
    expect(response.body.permission).toHaveProperty('module');
  });
});

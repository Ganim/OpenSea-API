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

  it('should add permission to group with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
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
    expect(response.body).toHaveProperty('success', true);
  });
});

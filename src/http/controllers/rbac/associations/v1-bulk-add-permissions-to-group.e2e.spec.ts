import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { makePermission } from '@/utils/tests/factories/rbac/make-permission';
import { makePermissionGroup } from '@/utils/tests/factories/rbac/make-permission-group';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Bulk Add Permissions To Group (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should bulk add permissions to group with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const group = await makePermissionGroup();
    const permissionOne = await makePermission();
    const permissionTwo = await makePermission();

    const response = await request(app.server)
      .post(
        `/v1/rbac/permission-groups/${group.id.toString()}/permissions/bulk`,
      )
      .set('Authorization', `Bearer ${token}`)
      .send({
        permissions: [
          {
            permissionCode: permissionOne.code.value,
            effect: 'allow',
          },
          {
            permissionCode: permissionTwo.code.value,
            effect: 'allow',
          },
        ],
      });

    expect(response.statusCode).toEqual(201);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('added');
    expect(response.body).toHaveProperty('skipped');
    expect(response.body).toHaveProperty('errors');
    expect(response.body.added).toBeGreaterThanOrEqual(1);
  });

  it('should not bulk add permissions without auth token', async () => {
    const response = await request(app.server)
      .post(
        '/v1/rbac/permission-groups/00000000-0000-0000-0000-000000000000/permissions/bulk',
      )
      .send({
        permissions: [
          {
            permissionCode: 'test.resource.action',
            effect: 'allow',
          },
        ],
      });

    expect(response.statusCode).toEqual(401);
  });
});

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { makePermissionGroup } from '@/utils/tests/factories/rbac/make-permission-group';
import { faker } from '@faker-js/faker';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Update Permission Group (e2e)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const tenantSetup = await createAndSetupTenant();
    tenantId = tenantSetup.tenantId;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should update permission group with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const group = await makePermissionGroup({ tenantId });

    const updatedName = `Updated Group ${faker.string.uuid().slice(0, 8)}`;
    const response = await request(app.server)
      .patch(`/v1/rbac/permission-groups/${group.id.toString()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: updatedName,
        description: 'Updated description',
      });

    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty('group');
    expect(response.body.group).toHaveProperty('name', updatedName);
  });
});

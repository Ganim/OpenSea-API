import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { makePermissionGroup } from '@/utils/tests/factories/rbac/make-permission-group';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Get Permission Group By ID (e2e)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get permission group by id with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const group = await makePermissionGroup();

    const response = await request(app.server)
      .get(`/v1/rbac/permission-groups/${group.id.toString()}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty('group');
    expect(response.body.group).toHaveProperty('id');
    expect(response.body.group).toHaveProperty('name');
    expect(response.body.group).toHaveProperty('isActive');
  });
});

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { makePermissionGroup } from '@/utils/tests/factories/rbac/make-permission-group';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Delete Permission Group (e2e)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const tenantSetup = await createAndSetupTenant();
    tenantId = tenantSetup.tenantId;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should delete permission group with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const group = await makePermissionGroup({ tenantId });

    const response = await request(app.server)
      .delete(`/v1/rbac/permission-groups/${group.id.toString()}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(204);
  });
});

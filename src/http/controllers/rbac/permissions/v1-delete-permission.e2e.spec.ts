import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { makePermission } from '@/utils/tests/factories/rbac/make-permission';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Delete Permission (e2e)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should delete permission with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const permission = await makePermission();

    const response = await request(app.server)
      .delete(`/v1/rbac/permissions/${permission.id.toString()}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(204);
  });
});

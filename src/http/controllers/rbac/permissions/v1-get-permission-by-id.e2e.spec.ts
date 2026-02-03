import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { makePermission } from '@/utils/tests/factories/rbac/make-permission';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Get Permission By ID (e2e)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get permission by id with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const permission = await makePermission();

    const response = await request(app.server)
      .get(`/v1/rbac/permissions/${permission.id.toString()}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty('permission');
    expect(response.body.permission).toHaveProperty('id');
    expect(response.body.permission).toHaveProperty('code');
    expect(response.body.permission).toHaveProperty('name');
  });
});

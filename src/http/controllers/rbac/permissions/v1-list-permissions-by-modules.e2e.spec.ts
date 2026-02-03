import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('List Permissions By Modules (e2e)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list permissions by modules with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/rbac/permissions/by-modules')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty('modules');
    expect(response.body).toHaveProperty('totalPermissions');
    expect(Array.isArray(response.body.modules)).toBe(true);
  });
});

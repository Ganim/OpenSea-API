import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('List User Permissions (e2e)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list user permissions with correct schema', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get(`/v1/rbac/users/${user.user.id.toString()}/permissions`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty('permissions');
    expect(Array.isArray(response.body.permissions)).toBe(true);
  });
});

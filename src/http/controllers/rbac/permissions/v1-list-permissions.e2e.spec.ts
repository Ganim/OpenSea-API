import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('List Permissions (e2e)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list permissions with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/rbac/permissions')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty('permissions');
    expect(response.body).toHaveProperty('total');
    expect(response.body).toHaveProperty('totalPages');
    expect(Array.isArray(response.body.permissions)).toBe(true);
  });
});

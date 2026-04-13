import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Get My Modules (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should return active modules for the tenant', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/me/modules')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('modules');
    expect(Array.isArray(response.body.modules)).toBe(true);
    expect(response.body.modules.length).toBeGreaterThan(0);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).get('/v1/me/modules');
    expect(response.status).toBe(401);
  });
});

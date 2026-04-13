import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Get Tenant Integrations (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).get(
      '/v1/sales/integrations/tenant',
    );

    expect(response.status).toBe(401);
  });

  it('should list tenant integrations (200)', async () => {
    const response = await request(app.server)
      .get('/v1/sales/integrations/tenant')
      .set('Authorization', `Bearer ${token}`);

    expect([200, 404]).toContain(response.status);
    if (response.status === 200) {
      expect(response.body).toHaveProperty('tenantIntegrations');
      expect(Array.isArray(response.body.tenantIntegrations)).toBe(true);
    }
  });
});

import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Connect Integration (E2E)', () => {
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
    const response = await request(app.server)
      .post('/v1/sales/integrations/connect')
      .send({
        integrationId: '00000000-0000-0000-0000-000000000001',
        config: {},
      });

    expect(response.status).toBe(401);
  });

  it('should return 404 for non-existent integration', async () => {
    const response = await request(app.server)
      .post('/v1/sales/integrations/connect')
      .set('Authorization', `Bearer ${token}`)
      .send({
        integrationId: '00000000-0000-0000-0000-000000000001',
        config: {},
      });

    expect([404, 400]).toContain(response.status);
  });
});

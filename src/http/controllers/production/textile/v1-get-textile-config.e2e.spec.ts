import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Get Textile Config (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });

  it('should get textile configuration', async () => {
    const response = await request(app.server)
      .get('/v1/production/textile/config')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('config');
    expect(response.body.config.industryType).toBe('TEXTILE');
    expect(response.body.config).toHaveProperty('enableSizeColorMatrix');
    expect(response.body.config).toHaveProperty('enableBundleTracking');
    expect(response.body.config).toHaveProperty('defaultSizes');
    expect(response.body.config).toHaveProperty('defaultBundleSize');
  });
});

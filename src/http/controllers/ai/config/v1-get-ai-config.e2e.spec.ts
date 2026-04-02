import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Get AI Config (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return default config for new tenant (200)', async () => {
    const response = await request(app.server)
      .get('/v1/ai/config')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('config');
    expect(response.body.config).toHaveProperty('tenantId');
    expect(response.body.config).toHaveProperty('assistantName');
    expect(response.body.config).toHaveProperty('personality');
    expect(response.body.config).toHaveProperty('toneOfVoice');
    expect(response.body.config).toHaveProperty('language');
    expect(response.body.config).toHaveProperty('enableDedicatedChat');
    expect(response.body.config).toHaveProperty('enableInlineContext');
    expect(response.body.config).toHaveProperty('enableCommandBar');
    expect(response.body.config).toHaveProperty('enableVoice');
    expect(response.body.config).toHaveProperty('canExecuteActions');
    expect(response.body.config).toHaveProperty('requireConfirmation');
    expect(response.body.config).toHaveProperty('enableProactiveInsights');
    expect(response.body.config).toHaveProperty('accessibleModules');
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).get('/v1/ai/config');

    expect(response.status).toBe(401);
  });
});

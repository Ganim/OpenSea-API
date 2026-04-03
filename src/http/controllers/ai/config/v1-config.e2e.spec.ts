import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('AI Config (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });


  it('GET /v1/ai/config — should return default config for new tenant', async () => {
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

  it('PUT /v1/ai/config — should update config', async () => {
    const response = await request(app.server)
      .put('/v1/ai/config')
      .set('Authorization', `Bearer ${token}`)
      .send({
        assistantName: 'Atlas Teste',
        personality: 'FRIENDLY',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('config');
    expect(response.body.config.assistantName).toBe('Atlas Teste');
    expect(response.body.config.personality).toBe('FRIENDLY');
  });

  it('PUT /v1/ai/config — should preserve fields not in update', async () => {
    // First set a known state
    await request(app.server)
      .put('/v1/ai/config')
      .set('Authorization', `Bearer ${token}`)
      .send({
        assistantName: 'Atlas Preservar',
        personality: 'FORMAL',
        toneOfVoice: 'WARM',
      });

    // Now update only one field
    const response = await request(app.server)
      .put('/v1/ai/config')
      .set('Authorization', `Bearer ${token}`)
      .send({
        toneOfVoice: 'DIRECT',
      });

    expect(response.status).toBe(200);
    expect(response.body.config.toneOfVoice).toBe('DIRECT');
    // Previously set fields should be preserved
    expect(response.body.config.assistantName).toBe('Atlas Preservar');
    expect(response.body.config.personality).toBe('FORMAL');
  });
});

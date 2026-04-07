import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Update AI Config (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });

  it('should update AI config (200)', async () => {
    const response = await request(app.server)
      .put('/v1/ai/config')
      .set('Authorization', `Bearer ${token}`)
      .send({
        assistantName: 'Atlas Teste E2E',
        personality: 'FRIENDLY',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('config');
    expect(response.body.config.assistantName).toBe('Atlas Teste E2E');
    expect(response.body.config.personality).toBe('FRIENDLY');
  });

  it('should preserve fields not in update', async () => {
    // Set a known state
    await request(app.server)
      .put('/v1/ai/config')
      .set('Authorization', `Bearer ${token}`)
      .send({
        assistantName: 'Atlas Preservar',
        personality: 'FORMAL',
        toneOfVoice: 'WARM',
      });

    // Update only one field
    const response = await request(app.server)
      .put('/v1/ai/config')
      .set('Authorization', `Bearer ${token}`)
      .send({
        toneOfVoice: 'DIRECT',
      });

    expect(response.status).toBe(200);
    expect(response.body.config.toneOfVoice).toBe('DIRECT');
    expect(response.body.config.assistantName).toBe('Atlas Preservar');
    expect(response.body.config.personality).toBe('FORMAL');
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).put('/v1/ai/config').send({
      assistantName: 'Test',
    });

    expect(response.status).toBe(401);
  });
});

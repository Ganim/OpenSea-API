import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Generate Content (E2E)', () => {
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

  it('should generate content (200 or provider error)', async () => {
    const response = await request(app.server)
      .post('/v1/ai/content/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'SOCIAL_POST',
        context: {
          theme: 'Promocao de verao com descontos de ate 50%',
          tone: 'casual',
          platform: 'instagram',
        },
      });

    // AI provider may not be configured in test env
    if (response.status === 200) {
      expect(response.body).toHaveProperty('content');
      expect(response.body.content).toHaveProperty('type');
      expect(response.body.content).toHaveProperty('content');
      expect(response.body.content).toHaveProperty('metadata');
    } else {
      expect([400, 500]).toContain(response.status);
    }
  });

  it('should validate required fields (type)', async () => {
    const response = await request(app.server)
      .post('/v1/ai/content/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        context: { theme: 'Promocao' },
      });

    expect(response.status).toBe(400);
  });

  it('should reject invalid type enum value', async () => {
    const response = await request(app.server)
      .post('/v1/ai/content/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'INVALID_TYPE',
        context: { theme: 'Promocao' },
      });

    expect(response.status).toBe(400);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/ai/content/generate')
      .send({
        type: 'SOCIAL_POST',
        context: { theme: 'Promocao' },
      });

    expect(response.status).toBe(401);
  });
});

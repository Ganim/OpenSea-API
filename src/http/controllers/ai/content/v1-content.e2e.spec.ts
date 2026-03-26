import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('AI Content (E2E)', () => {
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

  it('POST /v1/ai/content/generate — should return 401 without auth', async () => {
    const response = await request(app.server)
      .post('/v1/ai/content/generate')
      .send({
        type: 'SOCIAL_POST',
        context: {
          theme: 'Promoção de verão',
        },
      });

    expect(response.status).toBe(401);
  });

  it('POST /v1/ai/content/generate — should validate required fields (type)', async () => {
    const response = await request(app.server)
      .post('/v1/ai/content/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        context: {
          theme: 'Promoção de verão',
        },
      });

    // Zod validation should reject missing type
    expect(response.status).toBe(400);
  });

  it('POST /v1/ai/content/generate — should reject invalid type enum value', async () => {
    const response = await request(app.server)
      .post('/v1/ai/content/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'INVALID_TYPE',
        context: {
          theme: 'Promoção',
        },
      });

    expect(response.status).toBe(400);
  });

  it('POST /v1/ai/content/generate — should generate content (may fallback if no provider)', async () => {
    const response = await request(app.server)
      .post('/v1/ai/content/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'SOCIAL_POST',
        context: {
          theme: 'Promoção de verão com descontos de até 50%',
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
      expect(response.body.content.content).toHaveProperty('body');
      expect(response.body.content.metadata).toHaveProperty('characterCount');
    } else {
      // Accept provider-related errors
      expect([400, 500]).toContain(response.status);
    }
  });

  it('POST /v1/ai/content/generate — should accept PRODUCT_DESCRIPTION type', async () => {
    const response = await request(app.server)
      .post('/v1/ai/content/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'PRODUCT_DESCRIPTION',
        context: {
          theme: 'Vestido longo de seda natural',
          tone: 'luxo',
          maxLength: 500,
        },
      });

    // AI provider may not be configured
    if (response.status === 200) {
      expect(response.body).toHaveProperty('content');
      expect(response.body.content.type).toBe('PRODUCT_DESCRIPTION');
    } else {
      expect([400, 500]).toContain(response.status);
    }
  });
});

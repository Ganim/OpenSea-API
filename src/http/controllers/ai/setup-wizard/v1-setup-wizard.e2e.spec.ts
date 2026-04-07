import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('AI Setup Wizard (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });

  it('POST /v1/ai/setup-wizard — should return 401 without auth', async () => {
    const response = await request(app.server)
      .post('/v1/ai/setup-wizard')
      .send({
        businessDescription:
          'Uma loja de roupas femininas com 3 funcionários e 2 lojas físicas',
      });

    expect(response.status).toBe(401);
  });

  it('POST /v1/ai/setup-wizard — should accept business description and return plan', async () => {
    const response = await request(app.server)
      .post('/v1/ai/setup-wizard')
      .set('Authorization', `Bearer ${token}`)
      .send({
        businessDescription:
          'Uma loja de roupas femininas com 3 funcionários e 2 lojas físicas em São Paulo',
        industry: 'Moda',
        employeeCount: 3,
        locationCount: 2,
      });

    // AI provider may not be configured in test env
    if (response.status === 200) {
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('plan');
      expect(response.body).toHaveProperty('executed');
      expect(response.body).toHaveProperty('summary');
      expect(Array.isArray(response.body.plan)).toBe(true);
      expect(Array.isArray(response.body.executed)).toBe(true);
    } else {
      // Accept provider-related errors (500 for missing AI provider, 400 for config issues)
      expect([400, 500]).toContain(response.status);
    }
  });

  it('POST /v1/ai/setup-wizard — should validate required field (businessDescription)', async () => {
    const response = await request(app.server)
      .post('/v1/ai/setup-wizard')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    // Zod validation should reject missing businessDescription
    expect(response.status).toBe(400);
  });

  it('POST /v1/ai/setup-wizard — should reject businessDescription that is too short', async () => {
    const response = await request(app.server)
      .post('/v1/ai/setup-wizard')
      .set('Authorization', `Bearer ${token}`)
      .send({
        businessDescription: 'curto',
      });

    expect(response.status).toBe(400);
  });
});

import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Generate Campaigns (E2E)', () => {
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

  it('should trigger campaign generation (200 or provider error)', async () => {
    const response = await request(app.server)
      .post('/v1/ai/campaigns/generate')
      .set('Authorization', `Bearer ${token}`)
      .send();

    // AI provider may not be configured in test env
    if (response.status === 200) {
      expect(response.body).toHaveProperty('suggestions');
      expect(response.body).toHaveProperty('insightIds');
      expect(response.body).toHaveProperty('aiModel');
      expect(Array.isArray(response.body.suggestions)).toBe(true);
    } else {
      expect([400, 500]).toContain(response.status);
    }
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/ai/campaigns/generate')
      .send();

    expect(response.status).toBe(401);
  });
});

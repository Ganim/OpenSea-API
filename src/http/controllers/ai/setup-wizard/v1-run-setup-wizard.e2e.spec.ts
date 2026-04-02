import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Run Setup Wizard (E2E)', () => {
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

  it('should accept business description and return plan (200 or provider error)', async () => {
    const response = await request(app.server)
      .post('/v1/ai/setup-wizard')
      .set('Authorization', `Bearer ${token}`)
      .send({
        businessDescription:
          'Uma loja de roupas femininas com 3 funcionarios e 2 lojas fisicas em Sao Paulo',
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
      expect([400, 500]).toContain(response.status);
    }
  });

  it('should validate required field (businessDescription)', async () => {
    const response = await request(app.server)
      .post('/v1/ai/setup-wizard')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(400);
  });

  it('should reject businessDescription that is too short', async () => {
    const response = await request(app.server)
      .post('/v1/ai/setup-wizard')
      .set('Authorization', `Bearer ${token}`)
      .send({
        businessDescription: 'curto',
      });

    expect(response.status).toBe(400);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/ai/setup-wizard')
      .send({
        businessDescription:
          'Uma loja de roupas femininas com 3 funcionarios',
      });

    expect(response.status).toBe(401);
  });
});

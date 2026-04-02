import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Generate Insights (E2E)', () => {
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

  it('should trigger insight generation (200)', async () => {
    const response = await request(app.server)
      .post('/v1/ai/insights/generate')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('result');
    expect(response.body.result).toHaveProperty('generated');
    expect(response.body.result).toHaveProperty('skippedDuplicates');
    expect(response.body.result).toHaveProperty('errors');
    expect(typeof response.body.result.generated).toBe('number');
    expect(typeof response.body.result.skippedDuplicates).toBe('number');
    expect(Array.isArray(response.body.result.errors)).toBe(true);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).post(
      '/v1/ai/insights/generate',
    );

    expect(response.status).toBe(401);
  });
});

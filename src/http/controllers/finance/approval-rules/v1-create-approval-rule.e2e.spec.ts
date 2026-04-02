import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Approval Rule (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create an approval rule', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/finance/approval-rules')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Rule E2E ${Date.now()}`,
        action: 'AUTO_APPROVE',
        maxAmount: 5000,
        priority: 1,
      });

    expect(response.status).toBe(201);
    expect(response.body.rule).toBeDefined();
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server)
      .post('/v1/finance/approval-rules')
      .send({
        name: 'No Auth Rule',
        action: 'AUTO_APPROVE',
      });

    expect(response.status).toBe(401);
  });
});

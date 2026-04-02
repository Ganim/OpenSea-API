import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Chart of Account (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a chart of account', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/finance/chart-of-accounts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: `1.${Date.now() % 10000}`,
        name: `Account E2E ${Date.now()}`,
        type: 'ASSET',
        nature: 'DEBIT',
      });

    expect(response.status).toBe(201);
    expect(response.body.chartOfAccount).toBeDefined();
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server)
      .post('/v1/finance/chart-of-accounts')
      .send({
        code: '1.0001',
        name: 'No Auth Account',
        type: 'ASSET',
        nature: 'DEBIT',
      });

    expect(response.status).toBe(401);
  });
});

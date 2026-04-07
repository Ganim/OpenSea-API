import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Generate Tax Obligations (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should generate tax obligations for a given month', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/finance/compliance/tax-obligations/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({ year: 2026, month: 1 });

    expect(response.status).toBe(201);
    expect(response.body.created).toBeDefined();
    expect(response.body.skipped).toBeDefined();
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server)
      .post('/v1/finance/compliance/tax-obligations/generate')
      .send({ year: 2026, month: 1 });

    expect(response.status).toBe(401);
  });
});

import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Cost Center (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a cost center', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const ts = Date.now();

    const response = await request(app.server)
      .post('/v1/finance/cost-centers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: `CC-E2E-${ts}`,
        name: 'E2E Cost Center',
      });

    expect(response.status).toBe(201);
    expect(response.body.costCenter).toEqual(
      expect.objectContaining({
        code: `CC-E2E-${ts}`,
        name: 'E2E Cost Center',
      }),
    );
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).post('/v1/finance/cost-centers');

    expect(response.status).toBe(401);
  });
});

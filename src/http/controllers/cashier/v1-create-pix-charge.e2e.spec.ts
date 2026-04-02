import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create PIX Charge (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/cashier/pix')
      .send({ amount: 100, description: 'Test charge' });

    expect(response.status).toBe(401);
  });

  it('should reject request with missing required fields', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/cashier/pix')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.status).toBeGreaterThanOrEqual(400);
  });
});

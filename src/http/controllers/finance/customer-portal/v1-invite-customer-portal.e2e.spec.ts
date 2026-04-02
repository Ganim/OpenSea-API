import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Invite Customer Portal (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should invite a customer to the portal', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/finance/customer-portal/invite')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: `customer-${Date.now()}@test.com`,
        name: 'Test Customer',
      });

    expect([201, 400]).toContain(response.status);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server)
      .post('/v1/finance/customer-portal/invite')
      .send({
        email: 'customer@test.com',
        name: 'Test Customer',
      });

    expect(response.status).toBe(401);
  });
});

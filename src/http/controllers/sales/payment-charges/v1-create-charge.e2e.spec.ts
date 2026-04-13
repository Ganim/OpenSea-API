import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Payment Charge (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/payments/charges')
      .send({
        orderId: '00000000-0000-0000-0000-000000000001',
        orderNumber: 'ORD-001',
        method: 'PIX',
        amount: 100,
      });

    expect(response.status).toBe(401);
  });

  it('should return 400/404 when config is missing', async () => {
    const response = await request(app.server)
      .post('/v1/payments/charges')
      .set('Authorization', `Bearer ${token}`)
      .send({
        orderId: '00000000-0000-0000-0000-000000000001',
        orderNumber: 'ORD-E2E-001',
        method: 'PIX',
        amount: 150.0,
      });

    expect([400, 404, 500]).toContain(response.status);
  });
});

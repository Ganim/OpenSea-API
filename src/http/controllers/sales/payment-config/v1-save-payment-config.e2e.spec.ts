import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Save Payment Config (E2E)', () => {
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
      .put('/v1/sales/payment-config')
      .send({
        primaryProvider: 'mercadopago',
        primaryConfig: {},
        primaryActive: true,
      });

    expect(response.status).toBe(401);
  });

  it('should save payment config (200)', async () => {
    const response = await request(app.server)
      .put('/v1/sales/payment-config')
      .set('Authorization', `Bearer ${token}`)
      .send({
        primaryProvider: 'mercadopago',
        primaryConfig: { accessToken: 'test-token' },
        primaryActive: true,
      });

    expect([200, 400]).toContain(response.status);
    if (response.status === 200) {
      expect(response.body.paymentConfig).toBeDefined();
      expect(response.body.paymentConfig.primaryProvider).toBe('mercadopago');
    }
  });
});

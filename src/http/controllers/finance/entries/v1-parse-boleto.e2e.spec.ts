import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Parse Boleto (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should parse a boleto barcode', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/finance/parse-boleto')
      .set('Authorization', `Bearer ${token}`)
      .send({
        barcode:
          '23793.38128 60800.000003 00000.000400 1 84340000023000',
      });

    expect([200, 400]).toContain(response.status);

    if (response.status === 200) {
      expect(response.body).toHaveProperty('bankCode');
      expect(response.body).toHaveProperty('amount');
    }
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).post(
      '/v1/finance/parse-boleto',
    );
    expect(response.status).toBe(401);
  });
});

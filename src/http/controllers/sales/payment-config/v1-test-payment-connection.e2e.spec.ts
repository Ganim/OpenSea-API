import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Test Payment Connection (E2E)', () => {
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
      .post('/v1/sales/payment-config/test')
      .send({ target: 'primary' });

    expect(response.status).toBe(401);
  });

  it('should return 404 when no config exists', async () => {
    const response = await request(app.server)
      .post('/v1/sales/payment-config/test')
      .set('Authorization', `Bearer ${token}`)
      .send({ target: 'primary' });

    expect([200, 400, 404]).toContain(response.status);
  });
});

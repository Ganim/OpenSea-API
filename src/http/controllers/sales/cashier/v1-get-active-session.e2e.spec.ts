import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Get Active Cashier Session (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).get(
      '/v1/sales/cashier/sessions/active',
    );

    expect(response.status).toBe(401);
  });

  it('should return null when no active session (200)', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/sales/cashier/sessions/active')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.cashierSession).toBeNull();
  });

  it('should return active session after opening one (200)', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    // Open a session first
    await request(app.server)
      .post('/v1/sales/cashier/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({ openingBalance: 100 });

    const response = await request(app.server)
      .get('/v1/sales/cashier/sessions/active')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.cashierSession).toBeDefined();
    expect(response.body.cashierSession.status).toBe('OPEN');
  });
});

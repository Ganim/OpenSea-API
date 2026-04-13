import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('List Cashier Transactions (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).get(
      '/v1/sales/cashier/sessions/00000000-0000-0000-0000-000000000001/transactions',
    );

    expect(response.status).toBe(401);
  });

  it('should return 404 for non-existent session', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get(
        '/v1/sales/cashier/sessions/00000000-0000-0000-0000-000000000001/transactions',
      )
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it('should list transactions for a session (200)', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    // Open a session
    const openRes = await request(app.server)
      .post('/v1/sales/cashier/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({ openingBalance: 100 });

    const sessionId = openRes.body.cashierSession.id;

    const response = await request(app.server)
      .get(`/v1/sales/cashier/sessions/${sessionId}/transactions`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.transactions).toBeDefined();
    expect(Array.isArray(response.body.transactions)).toBe(true);
  });
});

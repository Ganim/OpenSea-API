import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Cashier Transaction (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post(
        '/v1/sales/cashier/sessions/00000000-0000-0000-0000-000000000001/transactions',
      )
      .send({ type: 'SALE', amount: 50 });

    expect(response.status).toBe(401);
  });

  it('should create a transaction in an open session (201)', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    // Open a session
    const openRes = await request(app.server)
      .post('/v1/sales/cashier/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({ openingBalance: 100 });

    const sessionId = openRes.body.cashierSession.id;

    const response = await request(app.server)
      .post(`/v1/sales/cashier/sessions/${sessionId}/transactions`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'SALE',
        amount: 75,
        description: `Test sale ${Date.now()}`,
        paymentMethod: 'CASH',
      });

    expect(response.status).toBe(201);
    expect(response.body.transaction).toBeDefined();
    expect(response.body.transaction.type).toBe('SALE');
    expect(response.body.transaction.amount).toBe(75);
  });
});

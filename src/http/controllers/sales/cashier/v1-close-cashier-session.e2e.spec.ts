import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Close Cashier Session (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .patch(
        '/v1/sales/cashier/sessions/00000000-0000-0000-0000-000000000001/close',
      )
      .send({ closingBalance: 100 });

    expect(response.status).toBe(401);
  });

  it('should close an open session (200)', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    // Open a session
    const openRes = await request(app.server)
      .post('/v1/sales/cashier/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({ openingBalance: 300 });

    const sessionId = openRes.body.cashierSession.id;

    const response = await request(app.server)
      .patch(`/v1/sales/cashier/sessions/${sessionId}/close`)
      .set('Authorization', `Bearer ${token}`)
      .send({ closingBalance: 350 });

    expect(response.status).toBe(200);
    expect(response.body.cashierSession).toBeDefined();
    expect(response.body.cashierSession.status).toBe('CLOSED');
  });
});

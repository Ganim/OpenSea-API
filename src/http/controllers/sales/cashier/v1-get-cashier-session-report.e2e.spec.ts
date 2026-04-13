import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Get Cashier Session Report (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).get(
      '/v1/sales/cashier/sessions/00000000-0000-0000-0000-000000000001/report',
    );

    expect(response.status).toBe(401);
  });

  it('should return 404 for non-existent session', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get(
        '/v1/sales/cashier/sessions/00000000-0000-0000-0000-000000000001/report',
      )
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it('should get session report (200)', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    // Open a session
    const openRes = await request(app.server)
      .post('/v1/sales/cashier/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({ openingBalance: 500 });

    const sessionId = openRes.body.cashierSession.id;

    const response = await request(app.server)
      .get(`/v1/sales/cashier/sessions/${sessionId}/report`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.sessionId).toBe(sessionId);
    expect(response.body.status).toBe('OPEN');
    expect(response.body.openingBalance).toBe(500);
    expect(response.body.totals).toBeDefined();
  });
});

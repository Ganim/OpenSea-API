import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Cashier Sessions (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /v1/sales/cashier/sessions should open a cashier session (201)', async () => {
    const response = await request(app.server)
      .post('/v1/sales/cashier/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        openingBalance: 200,
        notes: 'Opening session for E2E test',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('cashierSession');
    expect(response.body.cashierSession).toHaveProperty('id');
    expect(response.body.cashierSession.status).toBe('OPEN');
  });

  it('GET /v1/sales/cashier/sessions should list cashier sessions (200)', async () => {
    const response = await request(app.server)
      .get('/v1/sales/cashier/sessions')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('cashierSessions');
    expect(response.body).toHaveProperty('total');
    expect(Array.isArray(response.body.cashierSessions)).toBe(true);
  });

  it('GET /v1/sales/cashier/sessions/:id should get cashier session by id (200)', async () => {
    // Close any existing open sessions first
    const activeResponse = await request(app.server)
      .get('/v1/sales/cashier/sessions/active')
      .set('Authorization', `Bearer ${token}`);

    if (activeResponse.status === 200 && activeResponse.body.cashierSession) {
      await request(app.server)
        .post(
          `/v1/sales/cashier/sessions/${activeResponse.body.cashierSession.id}/close`,
        )
        .set('Authorization', `Bearer ${token}`)
        .send({ closingBalance: 200 });
    }

    const createResponse = await request(app.server)
      .post('/v1/sales/cashier/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        openingBalance: 100,
        notes: 'Session for GetById test',
      });

    const sessionId = createResponse.body.cashierSession.id;

    const response = await request(app.server)
      .get(`/v1/sales/cashier/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('cashierSession');
    expect(response.body.cashierSession.id).toBe(sessionId);
  });

  it('POST /v1/sales/cashier/sessions/:id/close should close a session (200)', async () => {
    // Close any existing open sessions first
    const activeResponse = await request(app.server)
      .get('/v1/sales/cashier/sessions/active')
      .set('Authorization', `Bearer ${token}`);

    if (activeResponse.status === 200 && activeResponse.body.cashierSession) {
      await request(app.server)
        .post(
          `/v1/sales/cashier/sessions/${activeResponse.body.cashierSession.id}/close`,
        )
        .set('Authorization', `Bearer ${token}`)
        .send({ closingBalance: 100 });
    }

    const createResponse = await request(app.server)
      .post('/v1/sales/cashier/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        openingBalance: 500,
        notes: 'Session to close',
      });

    const sessionId = createResponse.body.cashierSession.id;

    const response = await request(app.server)
      .post(`/v1/sales/cashier/sessions/${sessionId}/close`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        closingBalance: 500,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('cashierSession');
    expect(response.body.cashierSession.status).toBe('CLOSED');
  });
});

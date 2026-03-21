import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('POS (E2E)', () => {
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

  it('POST /v1/pos/terminals should create a terminal (201)', async () => {
    const response = await request(app.server)
      .post('/v1/pos/terminals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Terminal Caixa 01',
        mode: 'RETAIL',
        warehouseId: crypto.randomUUID(),
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('terminal');
    expect(response.body.terminal).toHaveProperty('id');
    expect(response.body.terminal.name).toBe('Terminal Caixa 01');
  });

  it('GET /v1/pos/terminals should list terminals (200)', async () => {
    const response = await request(app.server)
      .get('/v1/pos/terminals')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('terminals');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.terminals)).toBe(true);
  });

  it('POST /v1/pos/sessions/open should open a session (201)', async () => {
    const response = await request(app.server)
      .post('/v1/pos/sessions/open')
      .set('Authorization', `Bearer ${token}`)
      .send({
        terminalId: crypto.randomUUID(),
        openingBalance: 100.0,
        notes: 'Abertura de caixa teste',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('session');
    expect(response.body.session).toHaveProperty('id');
    expect(response.body.session.status).toBe('OPEN');
  });

  it('GET /v1/pos/sessions should list sessions (200)', async () => {
    const response = await request(app.server)
      .get('/v1/pos/sessions')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('sessions');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.sessions)).toBe(true);
  });
});

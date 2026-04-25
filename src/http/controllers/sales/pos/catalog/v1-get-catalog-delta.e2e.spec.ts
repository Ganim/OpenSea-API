import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

/**
 * E2E for `GET /v1/pos/catalog/delta`.
 *
 * Bootstrap path is necessarily long because the endpoint is
 * device-authenticated: we need a paired terminal whose `deviceToken` we hold,
 * so the test creates the terminal via the JWT-protected POST endpoint and
 * then pairs it via `pair-self` to obtain the device token. After that, every
 * call to the delta endpoint authenticates with `Authorization: Bearer
 * <deviceToken>` only — no JWT.
 */
describe('Get POS Catalog Delta (E2E)', () => {
  let tenantId: string;
  let token: string;
  let deviceToken: string;
  let terminalId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: ['sales.pos.terminals.register', 'sales.pos.terminals.pair'],
    });
    token = auth.token;

    const createTerminalResponse = await request(app.server)
      .post('/v1/pos/terminals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        terminalName: `Catalog Delta Terminal ${Date.now()}`,
        mode: 'SALES_ONLY',
      });

    expect(createTerminalResponse.status).toBe(201);
    terminalId = createTerminalResponse.body.terminal.id;

    const pairResponse = await request(app.server)
      .post(`/v1/pos/terminals/${terminalId}/pair-self`)
      .set('Authorization', `Bearer ${token}`)
      .send({ deviceLabel: `Catalog Delta Device ${Date.now()}` });

    expect(pairResponse.status).toBe(201);
    deviceToken = pairResponse.body.deviceToken;
  });

  it('returns 401 when device token is missing', async () => {
    const response = await request(app.server).get('/v1/pos/catalog/delta');

    expect(response.status).toBe(401);
  });

  it('returns 401 when device token is invalid', async () => {
    const response = await request(app.server)
      .get('/v1/pos/catalog/delta')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(401);
  });

  it('returns full catalog payload (200) for the paired terminal — empty zone scope is allowed', async () => {
    const response = await request(app.server)
      .get('/v1/pos/catalog/delta')
      .set('Authorization', `Bearer ${deviceToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('currentTimestamp');
    expect(response.body).toHaveProperty('terminalConfig');
    expect(response.body.terminalConfig.id).toBe(terminalId);
    expect(response.body.terminalConfig).toHaveProperty('operatorSessionMode');
    expect(response.body.terminalConfig).toHaveProperty('coordinationMode');
    expect(Array.isArray(response.body.terminalZoneLinks)).toBe(true);
    expect(Array.isArray(response.body.zones)).toBe(true);
    expect(Array.isArray(response.body.products)).toBe(true);
    expect(Array.isArray(response.body.variants)).toBe(true);
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(Array.isArray(response.body.promotions)).toBe(true);
    expect(Array.isArray(response.body.operators)).toBe(true);
    // tenant in this E2E has no fiscal config configured — must surface as null
    expect(response.body.fiscalConfig).toBeNull();
  });

  it('honors `since` query parameter — returns 200 with the same shape', async () => {
    const sinceCursor = new Date(Date.now() - 60_000).toISOString();
    const response = await request(app.server)
      .get(`/v1/pos/catalog/delta?since=${encodeURIComponent(sinceCursor)}`)
      .set('Authorization', `Bearer ${deviceToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('currentTimestamp');
    // Repeated calls with the same since cursor must remain idempotent in
    // shape — the response is a snapshot, not a stream.
    expect(response.body).toHaveProperty('items');
    expect(response.body).toHaveProperty('variants');
  });

  it('returns 400 when `since` cannot be parsed as a date', async () => {
    const response = await request(app.server)
      .get('/v1/pos/catalog/delta?since=not-a-date')
      .set('Authorization', `Bearer ${deviceToken}`);

    expect(response.status).toBe(400);
  });
});

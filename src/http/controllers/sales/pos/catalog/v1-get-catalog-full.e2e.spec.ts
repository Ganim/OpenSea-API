import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

/**
 * E2E for `GET /v1/pos/catalog/full`.
 *
 * Mirrors the bootstrap of the delta E2E: create a paired terminal via the
 * JWT-protected endpoints, capture the device token, then exercise the full
 * sync endpoint with `Authorization: Bearer <deviceToken>` only.
 *
 * The catalog scope here is intentionally empty — covering the pagination
 * contract (cursor/limit/nextCursor) on a non-empty scope requires fixtures
 * (warehouse + zone + bin + variant + item) that this test suite does not
 * yet stand up. The E2E focuses on auth + shape + query validation; the unit
 * spec covers the cursor mechanics in detail.
 */
describe('Get POS Catalog Full (E2E)', () => {
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
        terminalName: `Catalog Full Terminal ${Date.now()}`,
        mode: 'SALES_ONLY',
      });

    expect(createTerminalResponse.status).toBe(201);
    terminalId = createTerminalResponse.body.terminal.id;

    const pairResponse = await request(app.server)
      .post(`/v1/pos/terminals/${terminalId}/pair-self`)
      .set('Authorization', `Bearer ${token}`)
      .send({ deviceLabel: `Catalog Full Device ${Date.now()}` });

    expect(pairResponse.status).toBe(201);
    deviceToken = pairResponse.body.deviceToken;
  });

  it('returns 401 when device token is missing', async () => {
    const response = await request(app.server).get('/v1/pos/catalog/full');

    expect(response.status).toBe(401);
  });

  it('returns 401 when device token is invalid', async () => {
    const response = await request(app.server)
      .get('/v1/pos/catalog/full')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(401);
  });

  it('returns 200 with the full sync shape — empty zone scope yields nextCursor null', async () => {
    const response = await request(app.server)
      .get('/v1/pos/catalog/full')
      .set('Authorization', `Bearer ${deviceToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('currentTimestamp');
    expect(response.body).toHaveProperty('nextCursor');
    // empty terminal scope — no items means no next page
    expect(response.body.nextCursor).toBeNull();
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

  it('honors a custom limit query parameter', async () => {
    const response = await request(app.server)
      .get('/v1/pos/catalog/full?limit=50')
      .set('Authorization', `Bearer ${deviceToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('items');
    expect(response.body).toHaveProperty('nextCursor');
  });

  it('returns 400 when limit is below the minimum', async () => {
    const response = await request(app.server)
      .get('/v1/pos/catalog/full?limit=0')
      .set('Authorization', `Bearer ${deviceToken}`);

    expect(response.status).toBe(400);
  });

  it('returns 400 when limit exceeds the maximum (500)', async () => {
    const response = await request(app.server)
      .get('/v1/pos/catalog/full?limit=501')
      .set('Authorization', `Bearer ${deviceToken}`);

    expect(response.status).toBe(400);
  });

  it('returns 400 when cursor is not a valid UUID', async () => {
    const response = await request(app.server)
      .get('/v1/pos/catalog/full?cursor=not-a-uuid')
      .set('Authorization', `Bearer ${deviceToken}`);

    expect(response.status).toBe(400);
  });
});

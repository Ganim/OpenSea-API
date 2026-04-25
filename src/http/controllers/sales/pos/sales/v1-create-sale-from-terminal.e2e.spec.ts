import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

/**
 * E2E for `POST /v1/pos/sales` (Emporion Plan A — Task 28).
 *
 * The endpoint is device-authenticated (no JWT/RBAC) and idempotent on the
 * `Idempotency-Key` header. The bootstrap mirrors the catalog E2E: create a
 * paired terminal via the JWT-protected endpoints, capture the device token,
 * then exercise the endpoint with `Authorization: Bearer <deviceToken>` only.
 *
 * The happy path requires a fully-populated catalog (warehouse + zone + bin +
 * product + variant + item + customer + PDV pipeline + active operator) — a
 * setup the unit spec already covers exhaustively. This E2E focuses on the
 * HTTP-layer contract: auth, idempotency-key validation, schema rejection,
 * and the device-context wiring. Operator-authorization conflicts (which
 * require seeding `pos_terminal_operators`) are exercised here through the
 * 401 path, which is the actual user-visible behavior the desktop client
 * surfaces.
 */
describe('Create POS Sale From Terminal (E2E)', () => {
  let tenantId: string;
  let token: string;
  let deviceToken: string;
  let terminalId: string;

  const VALID_IDEMPOTENCY_KEY = 'aaaaaaaa-aaaa-4aaa-8aaa-000000000001';

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
        terminalName: `POS Sale Terminal ${Date.now()}`,
        mode: 'SALES_ONLY',
      });

    expect(createTerminalResponse.status).toBe(201);
    terminalId = createTerminalResponse.body.terminal.id;

    const pairResponse = await request(app.server)
      .post(`/v1/pos/terminals/${terminalId}/pair-self`)
      .set('Authorization', `Bearer ${token}`)
      .send({ deviceLabel: `POS Sale Device ${Date.now()}` });

    expect(pairResponse.status).toBe(201);
    deviceToken = pairResponse.body.deviceToken;
  });

  function buildBody(overrides: Record<string, unknown> = {}) {
    return {
      sessionId: 'bbbbbbbb-bbbb-4bbb-8bbb-000000000002',
      operatorEmployeeId: 'cccccccc-cccc-4ccc-8ccc-000000000003',
      cart: [
        {
          itemId: 'dddddddd-dddd-4ddd-8ddd-000000000004',
          variantId: 'eeeeeeee-eeee-4eee-8eee-000000000005',
          name: 'Test Product',
          quantity: 1,
          unitPrice: 100,
        },
      ],
      payments: [{ method: 'CASH', amount: 100 }],
      customerData: { kind: 'ANONYMOUS' },
      createdAt: '2026-04-25T10:00:00.000Z',
      ...overrides,
    };
  }

  it('returns 401 when device token is missing', async () => {
    const response = await request(app.server)
      .post('/v1/pos/sales')
      .set('Idempotency-Key', VALID_IDEMPOTENCY_KEY)
      .send(buildBody());

    expect(response.status).toBe(401);
  });

  it('returns 401 when device token is invalid', async () => {
    const response = await request(app.server)
      .post('/v1/pos/sales')
      .set('Authorization', 'Bearer invalid-token')
      .set('Idempotency-Key', VALID_IDEMPOTENCY_KEY)
      .send(buildBody());

    expect(response.status).toBe(401);
  });

  it('returns 400 when Idempotency-Key header is missing', async () => {
    const response = await request(app.server)
      .post('/v1/pos/sales')
      .set('Authorization', `Bearer ${deviceToken}`)
      .send(buildBody());

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/idempotency-key/i);
  });

  it('returns 400 when Idempotency-Key is not a UUID', async () => {
    const response = await request(app.server)
      .post('/v1/pos/sales')
      .set('Authorization', `Bearer ${deviceToken}`)
      .set('Idempotency-Key', 'not-a-uuid')
      .send(buildBody());

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/idempotency-key/i);
  });

  it('returns 400 when the cart is empty', async () => {
    const response = await request(app.server)
      .post('/v1/pos/sales')
      .set('Authorization', `Bearer ${deviceToken}`)
      .set('Idempotency-Key', VALID_IDEMPOTENCY_KEY)
      .send(buildBody({ cart: [] }));

    expect(response.status).toBe(400);
  });

  it('returns 401 when the operator is not authorized for the terminal', async () => {
    // Auth + idempotency-key + schema all pass; the use case raises
    // UnauthorizedError because no PosTerminalOperator row links the random
    // operatorEmployeeId to this freshly-paired terminal. The controller
    // maps that to 401.
    const response = await request(app.server)
      .post('/v1/pos/sales')
      .set('Authorization', `Bearer ${deviceToken}`)
      .set('Idempotency-Key', VALID_IDEMPOTENCY_KEY)
      .send(buildBody());

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/operator/i);
  });
});

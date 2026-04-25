import { randomUUID } from 'node:crypto';

import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { ZoneStructure } from '@/entities/stock/value-objects/zone-structure';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';
import { createItemE2E } from '@/utils/tests/factories/stock/create-item.e2e';
import type { Prisma } from '@prisma/generated/client.js';

/**
 * E2E for the **complete Emporion POS flow** (Plan A — Task 35).
 *
 * Acceptance test for Plan A: exercises every Task 23-34 endpoint that a
 * real desktop terminal touches, in the realistic order, and asserts that
 * they wire together. The test runs as **a single `it` block** because the
 * 9 phases share state (the same terminal, deviceToken, sessionId, Order id
 * and conflictId thread through every phase).
 *
 * Phases:
 *  1. Bootstrap (admin auth, tenant, system Customer, PDV pipeline,
 *     warehouse + zone with `allowsFractionalSale=true` + bin, product +
 *     variant + item with stock=100, employee + operator link, terminal
 *     + zone link, PosSession seeded directly via Prisma).
 *  2. Pair the device via `POST /v1/pos/terminals/:id/pair-self` and capture
 *     the `deviceToken`.
 *  3. `GET /v1/pos/catalog/full` with the device token — sanity-check the
 *     catalog payload includes the seeded item, variant, zone, operator,
 *     terminalConfig.
 *  4. `POST /v1/pos/sales` (Idempotency-Key #1, qty=5) — `confirmed`.
 *  5. `POST /v1/pos/sales` (Idempotency-Key #1 again) — `already_synced`,
 *     same `order.id`.
 *  6. `POST /v1/pos/sales` (Idempotency-Key #2, qty=200) — `409 conflict`
 *     because remaining stock is 95.
 *  7. `GET /v1/admin/pos/conflicts` — the new conflict appears, enriched
 *     with `terminalName` and `operatorName`.
 *  8. `POST /v1/admin/pos/conflicts/:id/resolve` (`FORCE_ADJUSTMENT`) —
 *     200, conflict moves to `FORCED_ADJUSTMENT`, fresh Order is
 *     `CONFIRMED`.
 *  9. `PUT /v1/admin/pos/fiscal-config` then `POST /v1/pos/fiscal/emit`
 *     against the Order from phase 4 — first call returns `AUTHORIZED`,
 *     second call returns `ALREADY_EMITTED` (idempotent).
 *
 * Simplifications (documented per CLAUDE.md guidance):
 *  - Pairing uses `pair-self` instead of generating a pairing code +
 *    redeeming it from a "device" — the pairing-code roundtrip mechanic is
 *    already covered by `v1-pair-device.e2e.spec.ts`. This test focuses on
 *    the business flow downstream of the pairing.
 *  - `PosSession` is seeded directly via Prisma instead of going through
 *    `POST /v1/pos/sessions/open` because that endpoint is exercised by its
 *    own E2E and adds no signal to this acceptance test.
 *  - System default `Customer`, `CrmPipeline` (`name='PDV'`) and
 *    `CrmPipelineStage` are seeded directly via Prisma — `CreateOrderUseCase`
 *    requires them but they have no HTTP CRUD path tied to the POS feature.
 *  - Warehouse / Zone / Bin are seeded via Prisma; the linking semantics for
 *    the catalog scope (Zone -> Bin -> Item) are unit-tested elsewhere.
 */
describe('POS Full Flow (E2E acceptance test for Plan A)', () => {
  let tenantId: string;
  let adminToken: string;
  let adminUserId: string;
  let terminalId: string;
  let deviceToken: string;
  let zoneId: string;
  let itemId: string;
  let variantId: string;
  let employeeId: string;
  let posSessionId: string;
  let firstOrderId: string;
  let conflictId: string;

  const FIRST_SALE_KEY = '11111111-1111-4111-8111-111111111111';
  const CONFLICT_SALE_KEY = '22222222-2222-4222-8222-222222222222';

  beforeAll(async () => {
    await app.ready();

    const tenantSetup = await createAndSetupTenant();
    tenantId = tenantSetup.tenantId;

    // The global admin-test group includes every permission the POS flow
    // touches (terminals.register, pair, admin, conflicts-resolve, hr.*),
    // so we skip the explicit `permissions` filter to avoid duplicating
    // the codes here. The auth helper still associates the user with the
    // tenant and returns a tenant-scoped JWT.
    const adminAuth = await createAndAuthenticateUser(app, { tenantId });
    adminToken = adminAuth.token;
    // The auth helper wraps the upstream `{ user: UserDTO }` payload in
    // another `{ user: ... }` envelope. The inner DTO is what carries the
    // database id we need for the `PosSession.operatorUserId` FK. Existing
    // POS specs already index `auth.user.id` (which is `undefined`) when
    // they only need a *nullable* user reference; here we need the real id
    // for the FK so we drill one level deeper.
    adminUserId = adminAuth.user.user.id;
  });

  it('completes the pair -> catalog -> sale -> conflict -> resolve -> fiscal pipeline', async () => {
    // -------------------------------------------------------------------
    // PHASE 1 — Bootstrap (Customers, Pipeline, Stock graph, Terminal)
    // -------------------------------------------------------------------

    // 1a) System default Customer (needed for ANONYMOUS / CPF_ONLY paths)
    await prisma.customer.create({
      data: {
        id: randomUUID(),
        tenantId,
        name: 'Consumidor Final',
        type: 'INDIVIDUAL',
        isSystem: true,
      },
    });

    // 1b) PDV pipeline + first stage — required by CreateOrderUseCase
    const pdvPipeline = await prisma.crmPipeline.create({
      data: {
        id: randomUUID(),
        tenantId,
        name: 'PDV',
        type: 'SALES',
        isActive: true,
      },
    });
    await prisma.crmPipelineStage.create({
      data: {
        id: randomUUID(),
        pipelineId: pdvPipeline.id,
        name: 'Aberto',
        type: 'OPEN',
        position: 0,
      },
    });

    // 1c) Stock graph: Warehouse -> Zone (fractional-friendly) -> Bin.
    //     Column widths are tight: warehouse.code is VarChar(5), zone.code
    //     is VarChar(5), bin.address is VarChar(32). The codes derive from
    //     the trailing digits of the current timestamp to stay unique
    //     across reruns of the persistent E2E DB.
    const stockTimestamp = Date.now();
    const stockSuffix = String(stockTimestamp).slice(-4);
    const warehouse = await prisma.warehouse.create({
      data: {
        tenantId,
        code: `W${stockSuffix}`,
        name: `Warehouse ${stockTimestamp}`,
      },
    });
    const zone = await prisma.zone.create({
      data: {
        tenantId,
        warehouseId: warehouse.id,
        code: `Z${stockSuffix}`,
        name: `Zone ${stockTimestamp}`,
        structure:
          ZoneStructure.empty().toJSON() as unknown as Prisma.InputJsonValue,
        allowsFractionalSale: true,
      },
    });
    zoneId = zone.id;
    const bin = await prisma.bin.create({
      data: {
        tenantId,
        zoneId,
        address: `B-${stockSuffix}-A`,
        aisle: 1,
        shelf: 1,
        position: 'A',
      },
    });

    // 1d) Item with 100 units (covers a qty-5 sale + leaves 95 for the
    //     qty-200 conflict scenario downstream).
    const stockSeed = await createItemE2E({
      tenantId,
      initialQuantity: 100,
      binId: bin.id,
    });
    itemId = stockSeed.item.id;
    variantId = stockSeed.variant.id;

    // 1e) Employee + Terminal + Zone link + Operator link (HTTP path —
    //     these are the surfaces the desktop UI exercises).
    const { employee } = await createEmployeeE2E({
      tenantId,
      status: 'ACTIVE',
    });
    employeeId = employee.id;

    const createTerminalResponse = await request(app.server)
      .post('/v1/pos/terminals')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        terminalName: `Full Flow Terminal ${Date.now()}`,
        mode: 'SALES_ONLY',
      });
    expect(createTerminalResponse.status).toBe(201);
    terminalId = createTerminalResponse.body.terminal.id;
    const terminalName = createTerminalResponse.body.terminal.terminalName;

    const assignZoneResponse = await request(app.server)
      .put(`/v1/pos/terminals/${terminalId}/zones/${zoneId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ tier: 'PRIMARY' });
    expect(assignZoneResponse.status).toBe(200);

    const assignOperatorResponse = await request(app.server)
      .post(`/v1/pos/terminals/${terminalId}/operators`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ employeeId });
    expect(assignOperatorResponse.status).toBe(200);

    // 1f) PosSession — required because Order.posSessionId carries a real
    //     FK to pos_sessions. Seed directly to avoid coupling this test to
    //     the open-session HTTP path.
    const posSession = await prisma.posSession.create({
      data: {
        id: randomUUID(),
        tenantId,
        terminalId,
        operatorUserId: adminUserId,
        status: 'OPEN',
        openingBalance: 0,
      },
    });
    posSessionId = posSession.id;

    // -------------------------------------------------------------------
    // PHASE 2 — Pair this device, capture deviceToken
    // -------------------------------------------------------------------
    const pairResponse = await request(app.server)
      .post(`/v1/pos/terminals/${terminalId}/pair-self`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ deviceLabel: `Full Flow Device ${Date.now()}` });
    expect(pairResponse.status).toBe(201);
    deviceToken = pairResponse.body.deviceToken;
    expect(typeof deviceToken).toBe('string');
    expect(deviceToken.length).toBeGreaterThan(0);

    // -------------------------------------------------------------------
    // PHASE 3 — Device pulls the full catalog
    // -------------------------------------------------------------------
    const catalogResponse = await request(app.server)
      .get('/v1/pos/catalog/full')
      .set('Authorization', `Bearer ${deviceToken}`);
    expect(catalogResponse.status).toBe(200);
    expect(catalogResponse.body.terminalConfig.id).toBe(terminalId);
    expect(Array.isArray(catalogResponse.body.zones)).toBe(true);
    expect(Array.isArray(catalogResponse.body.items)).toBe(true);
    expect(Array.isArray(catalogResponse.body.variants)).toBe(true);
    expect(Array.isArray(catalogResponse.body.products)).toBe(true);
    expect(Array.isArray(catalogResponse.body.operators)).toBe(true);
    // The seeded item lives in the terminal's zone — it must show up.
    const catalogItemIds = catalogResponse.body.items.map(
      (catalogItem: { id: string }) => catalogItem.id,
    );
    expect(catalogItemIds).toContain(itemId);
    const catalogVariantIds = catalogResponse.body.variants.map(
      (catalogVariant: { id: string }) => catalogVariant.id,
    );
    expect(catalogVariantIds).toContain(variantId);
    const catalogOperatorIds = catalogResponse.body.operators.map(
      (catalogOperator: { id: string }) => catalogOperator.id,
    );
    expect(catalogOperatorIds).toContain(employeeId);

    // -------------------------------------------------------------------
    // PHASE 4 — First sale: should confirm and decrement stock
    // -------------------------------------------------------------------
    const firstSaleBody = {
      sessionId: posSessionId,
      operatorEmployeeId: employeeId,
      cart: [
        {
          itemId,
          variantId,
          name: 'Test Product Line',
          quantity: 5,
          unitPrice: 24.9,
        },
      ],
      payments: [{ method: 'CASH', amount: 124.5 }],
      customerData: { kind: 'ANONYMOUS' as const },
      createdAt: new Date().toISOString(),
    };

    const firstSaleResponse = await request(app.server)
      .post('/v1/pos/sales')
      .set('Authorization', `Bearer ${deviceToken}`)
      .set('Idempotency-Key', FIRST_SALE_KEY)
      .send(firstSaleBody);

    expect(firstSaleResponse.status).toBe(200);
    expect(firstSaleResponse.body.status).toBe('confirmed');
    expect(firstSaleResponse.body.order.originSource).toBe('POS_DESKTOP');
    expect(firstSaleResponse.body.order.saleLocalUuid).toBe(FIRST_SALE_KEY);
    expect(firstSaleResponse.body.order.posTerminalId).toBe(terminalId);
    expect(firstSaleResponse.body.order.posSessionId).toBe(posSessionId);
    expect(firstSaleResponse.body.order.posOperatorEmployeeId).toBe(employeeId);
    firstOrderId = firstSaleResponse.body.order.id;

    // Persistence sanity-check: stock decremented by 5 (100 -> 95).
    const itemAfterSale = await prisma.item.findUnique({
      where: { id: itemId },
    });
    expect(itemAfterSale).not.toBeNull();
    expect(Number(itemAfterSale!.currentQuantity)).toBe(95);

    // -------------------------------------------------------------------
    // PHASE 5 — Idempotent replay: same Idempotency-Key returns same order
    // -------------------------------------------------------------------
    const replayResponse = await request(app.server)
      .post('/v1/pos/sales')
      .set('Authorization', `Bearer ${deviceToken}`)
      .set('Idempotency-Key', FIRST_SALE_KEY)
      .send(firstSaleBody);

    expect(replayResponse.status).toBe(200);
    expect(replayResponse.body.status).toBe('already_synced');
    expect(replayResponse.body.order.id).toBe(firstOrderId);

    // Stock must NOT have been double-decremented.
    const itemAfterReplay = await prisma.item.findUnique({
      where: { id: itemId },
    });
    expect(Number(itemAfterReplay!.currentQuantity)).toBe(95);

    // -------------------------------------------------------------------
    // PHASE 6 — Insufficient-stock sale -> 409 conflict
    // -------------------------------------------------------------------
    const conflictSaleBody = {
      sessionId: posSessionId,
      operatorEmployeeId: employeeId,
      cart: [
        {
          itemId,
          variantId,
          name: 'Test Product Line',
          quantity: 200,
          unitPrice: 24.9,
        },
      ],
      payments: [{ method: 'CASH', amount: 4980 }],
      customerData: { kind: 'ANONYMOUS' as const },
      createdAt: new Date().toISOString(),
    };

    const conflictSaleResponse = await request(app.server)
      .post('/v1/pos/sales')
      .set('Authorization', `Bearer ${deviceToken}`)
      .set('Idempotency-Key', CONFLICT_SALE_KEY)
      .send(conflictSaleBody);

    expect(conflictSaleResponse.status).toBe(409);
    expect(conflictSaleResponse.body.status).toBe('conflict');
    expect(typeof conflictSaleResponse.body.conflictId).toBe('string');
    expect(Array.isArray(conflictSaleResponse.body.conflicts)).toBe(true);
    expect(conflictSaleResponse.body.conflicts.length).toBeGreaterThan(0);
    expect(conflictSaleResponse.body.conflicts[0].reason).toBe(
      'INSUFFICIENT_STOCK',
    );
    expect(conflictSaleResponse.body.conflicts[0].requestedQuantity).toBe(200);
    expect(conflictSaleResponse.body.conflicts[0].availableQuantity).toBe(95);
    conflictId = conflictSaleResponse.body.conflictId;

    // Stock must remain at 95 (nothing was consumed by the conflict).
    const itemAfterConflict = await prisma.item.findUnique({
      where: { id: itemId },
    });
    expect(Number(itemAfterConflict!.currentQuantity)).toBe(95);

    // -------------------------------------------------------------------
    // PHASE 7 — Admin sees the conflict in the listing endpoint
    // -------------------------------------------------------------------
    const listConflictsResponse = await request(app.server)
      .get('/v1/admin/pos/conflicts')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(listConflictsResponse.status).toBe(200);
    expect(Array.isArray(listConflictsResponse.body.data)).toBe(true);
    const matchingConflict = listConflictsResponse.body.data.find(
      (row: { id: string }) => row.id === conflictId,
    );
    expect(matchingConflict).toBeDefined();
    expect(matchingConflict.status).toBe('PENDING_RESOLUTION');
    expect(matchingConflict.posTerminalId).toBe(terminalId);
    expect(matchingConflict.terminalName).toBe(terminalName);
    expect(matchingConflict.posOperatorEmployeeId).toBe(employeeId);
    // Operator enrichment: name comes from the Employee row; shortId is
    // backfilled by the seed migration introduced in Task 21.
    expect(typeof matchingConflict.operatorName).toBe('string');
    expect(matchingConflict.operatorName.length).toBeGreaterThan(0);

    // -------------------------------------------------------------------
    // PHASE 8 — Admin force-adjusts the stock and re-creates the Order
    // -------------------------------------------------------------------
    const resolveResponse = await request(app.server)
      .post(`/v1/admin/pos/conflicts/${conflictId}/resolve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        action: 'FORCE_ADJUSTMENT',
        notes: 'Stock recount confirmed extra units on the floor.',
      });

    expect(resolveResponse.status).toBe(200);
    expect(resolveResponse.body.conflict.status).toBe('FORCED_ADJUSTMENT');
    expect(resolveResponse.body.conflict.resolvedByUserId).not.toBeNull();
    expect(resolveResponse.body.order.status).toBe('CONFIRMED');
    expect(resolveResponse.body.order.originSource).toBe('POS_DESKTOP');
    expect(resolveResponse.body.order.posTerminalId).toBe(terminalId);

    // Persistence sanity-check: conflict is no longer pending.
    const persistedConflict = await prisma.posOrderConflict.findUnique({
      where: { id: conflictId },
    });
    expect(persistedConflict?.status).toBe('FORCED_ADJUSTMENT');
    expect(persistedConflict?.orderId).toBe(resolveResponse.body.order.id);

    // -------------------------------------------------------------------
    // PHASE 9 — Fiscal config + NFC-e emission for the original Order
    //           (idempotent on the Order id)
    // -------------------------------------------------------------------
    const fiscalConfigResponse = await request(app.server)
      .put('/v1/admin/pos/fiscal-config')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        enabledDocumentTypes: ['NFC_E'],
        defaultDocumentType: 'NFC_E',
        emissionMode: 'ONLINE_SYNC',
        certificatePath: '/secure/full-flow-cert.pfx',
        nfceSeries: 1,
        nfceNextNumber: 1,
      });
    expect(fiscalConfigResponse.status).toBe(200);

    // First emission — fresh authorization.
    const firstEmissionResponse = await request(app.server)
      .post('/v1/pos/fiscal/emit')
      .set('Authorization', `Bearer ${deviceToken}`)
      .send({ orderId: firstOrderId });

    expect(firstEmissionResponse.status).toBe(200);
    expect(firstEmissionResponse.body.status).toBe('AUTHORIZED');
    expect(firstEmissionResponse.body.documentType).toBe('NFC_E');
    expect(firstEmissionResponse.body.accessKey).toMatch(/^\d{44}$/);
    expect(typeof firstEmissionResponse.body.authorizationProtocol).toBe(
      'string',
    );

    // Second emission — same Order, must short-circuit to ALREADY_EMITTED
    // without changing the persisted authorization metadata.
    const secondEmissionResponse = await request(app.server)
      .post('/v1/pos/fiscal/emit')
      .set('Authorization', `Bearer ${deviceToken}`)
      .send({ orderId: firstOrderId });

    expect(secondEmissionResponse.status).toBe(200);
    expect(secondEmissionResponse.body.status).toBe('ALREADY_EMITTED');
    expect(secondEmissionResponse.body.accessKey).toBe(
      firstEmissionResponse.body.accessKey,
    );
    expect(secondEmissionResponse.body.authorizationProtocol).toBe(
      firstEmissionResponse.body.authorizationProtocol,
    );

    // Persistence sanity-check: the Order is stamped with the fiscal
    // outputs (single source of truth for the desktop's offline cache).
    const persistedOrder = await prisma.order.findUnique({
      where: { id: firstOrderId },
    });
    expect(persistedOrder?.fiscalEmissionStatus).toBe('AUTHORIZED');
    expect(persistedOrder?.fiscalDocumentType).toBe('NFC_E');
    expect(persistedOrder?.fiscalAccessKey).toMatch(/^\d{44}$/);
  });
});

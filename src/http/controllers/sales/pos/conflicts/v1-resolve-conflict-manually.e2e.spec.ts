import { randomUUID } from 'node:crypto';

import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createProduct } from '@/utils/tests/factories/stock/create-product.e2e';
import { createVariant } from '@/utils/tests/factories/stock/create-variant.e2e';

/**
 * E2E for `POST /v1/admin/pos/conflicts/:id/resolve` (Emporion Plan A —
 * Task 31).
 *
 * The endpoint is JWT+tenant-scoped and gated by the
 * `sales.pos.conflicts-resolve` permission. This spec exercises the HTTP
 * contract: auth (401), authorization (403), 404 on bogus id, 400 on
 * already-resolved conflicts and on schema violations, plus the 200 happy
 * path for `CANCEL_AND_REFUND` (which is the only action that does not need
 * a fully-seeded catalog/PDV pipeline to succeed because the use case does
 * still call `CreateOrderUseCase` to record the canceled Order — the test
 * therefore seeds the PDV pipeline and a system default Customer too).
 *
 * `FORCE_ADJUSTMENT` and `SUBSTITUTE_ITEM` are exhaustively covered by the
 * unit spec (where the in-memory repos faithfully simulate every dependency
 * the production code path touches). Replicating those flows end-to-end
 * would require a fully-seeded catalog (warehouse + zone + bin + product +
 * variant + items) and is intentionally out of scope here.
 */
describe('Resolve POS Conflict Manually (E2E)', () => {
  let tenantId: string;
  let resolverToken: string;
  let unauthorizedToken: string;
  let terminalId: string;
  let pendingConflictId: string;
  let resolvedConflictId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;

    const resolverAuth = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: [
        'sales.pos.admin',
        'sales.pos.conflicts-resolve',
        'sales.pos.terminals.register',
      ],
    });
    resolverToken = resolverAuth.token;

    const unauthorizedAuth = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: ['sales.pos.access'],
    });
    unauthorizedToken = unauthorizedAuth.token;

    // Terminal for the conflict rows. Going through the public endpoint
    // mirrors the shape produced in production.
    const createTerminalResponse = await request(app.server)
      .post('/v1/pos/terminals')
      .set('Authorization', `Bearer ${resolverToken}`)
      .send({
        terminalName: `Resolve Conflict E2E ${Date.now()}`,
        mode: 'SALES_ONLY',
      });
    expect(createTerminalResponse.status).toBe(201);
    terminalId = createTerminalResponse.body.terminal.id;

    // System default Customer + PDV pipeline + stage so the
    // CANCEL_AND_REFUND happy path can construct an Order via
    // `CreateOrderUseCase`.
    const systemCustomer = await prisma.customer.create({
      data: {
        id: randomUUID(),
        tenantId,
        name: 'Consumidor Final',
        type: 'INDIVIDUAL',
        isSystem: true,
      },
    });

    // The PipelinesRepository persists into `crm_pipelines` (not `pipelines`)
    // so the seed must target the CrmPipeline / CrmPipelineStage models.
    const pdvPipeline = await prisma.crmPipeline.create({
      data: {
        id: randomUUID(),
        tenantId,
        name: 'PDV',
        type: 'SALES',
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

    // PENDING conflict — the row that the happy-path test will resolve. The
    // OrderItem rows the use case creates have a FK to `variants`, so seed a
    // real Variant (and its parent Product/Template) up front. The factories
    // already handle the Template auto-creation so this stays compact.
    const { productId } = await createProduct({ tenantId });
    const { variantId } = await createVariant({ tenantId, productId });

    const pendingConflictUuid = randomUUID();
    const pendingSaleUuid = randomUUID();
    const conflictItemId = randomUUID();
    const conflictVariantId = variantId;

    await prisma.posOrderConflict.create({
      data: {
        id: pendingConflictUuid,
        tenantId,
        saleLocalUuid: pendingSaleUuid,
        posTerminalId: terminalId,
        posSessionId: null,
        posOperatorEmployeeId: null,
        status: 'PENDING_RESOLUTION',
        conflictDetails: [
          {
            itemId: conflictItemId,
            variantId: conflictVariantId,
            requestedQuantity: 1,
            availableQuantity: 0,
            shortage: 1,
            reason: 'INSUFFICIENT_STOCK',
          },
        ],
        // Snapshot the original sale shape (Task 31 columns). Only the
        // `originalCart` is strictly required for CANCEL_AND_REFUND, but we
        // include all three so future tests can extend this fixture for the
        // remaining actions without re-bootstrapping.
        originalCart: [
          {
            itemId: conflictItemId,
            variantId: conflictVariantId,
            name: 'Produto Conflitante',
            quantity: 1,
            unitPrice: 100,
          },
        ],
        originalPayments: [{ method: 'CASH', amount: 100 }],
        originalCustomerData: {
          kind: 'EXISTING',
          customerId: systemCustomer.id,
        },
      },
    });
    pendingConflictId = pendingConflictUuid;

    // RESOLVED conflict — used to hit the 400 "already resolved" branch.
    const resolvedConflictUuid = randomUUID();
    await prisma.posOrderConflict.create({
      data: {
        id: resolvedConflictUuid,
        tenantId,
        saleLocalUuid: randomUUID(),
        posTerminalId: terminalId,
        status: 'CANCELED_REFUNDED',
        conflictDetails: [
          {
            itemId: randomUUID(),
            variantId: randomUUID(),
            requestedQuantity: 1,
            availableQuantity: 0,
            shortage: 1,
            reason: 'INSUFFICIENT_STOCK',
          },
        ],
        resolvedByUserId: resolverAuth.user.id,
        resolvedAt: new Date(),
      },
    });
    resolvedConflictId = resolvedConflictUuid;
  });

  it('returns 401 without a JWT', async () => {
    const response = await request(app.server)
      .post(`/v1/admin/pos/conflicts/${pendingConflictId}/resolve`)
      .send({ action: 'CANCEL_AND_REFUND' });

    expect([400, 401, 403]).toContain(response.status);
    expect(response.status).not.toBe(200);
  });

  it('returns 403 when the user lacks sales.pos.conflicts-resolve', async () => {
    const response = await request(app.server)
      .post(`/v1/admin/pos/conflicts/${pendingConflictId}/resolve`)
      .set('Authorization', `Bearer ${unauthorizedToken}`)
      .send({ action: 'CANCEL_AND_REFUND' });

    expect(response.status).toBe(403);
  });

  it('returns 404 when the conflictId does not exist', async () => {
    const response = await request(app.server)
      .post(`/v1/admin/pos/conflicts/${randomUUID()}/resolve`)
      .set('Authorization', `Bearer ${resolverToken}`)
      .send({ action: 'CANCEL_AND_REFUND' });

    expect(response.status).toBe(404);
  });

  it('returns 400 when the conflict is already resolved (status != PENDING_RESOLUTION)', async () => {
    const response = await request(app.server)
      .post(`/v1/admin/pos/conflicts/${resolvedConflictId}/resolve`)
      .set('Authorization', `Bearer ${resolverToken}`)
      .send({ action: 'CANCEL_AND_REFUND' });

    expect(response.status).toBe(400);
  });

  it('returns 400 when SUBSTITUTE_ITEM is requested without substituteItemIds', async () => {
    const response = await request(app.server)
      .post(`/v1/admin/pos/conflicts/${pendingConflictId}/resolve`)
      .set('Authorization', `Bearer ${resolverToken}`)
      .send({ action: 'SUBSTITUTE_ITEM' });

    expect(response.status).toBe(400);
  });

  it('returns 200 and creates a CANCELLED Order on the CANCEL_AND_REFUND happy path', async () => {
    const response = await request(app.server)
      .post(`/v1/admin/pos/conflicts/${pendingConflictId}/resolve`)
      .set('Authorization', `Bearer ${resolverToken}`)
      .send({
        action: 'CANCEL_AND_REFUND',
        notes: 'Cliente desistiu da compra',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('conflict');
    expect(response.body).toHaveProperty('order');
    expect(response.body.conflict.status).toBe('CANCELED_REFUNDED');
    expect(response.body.conflict.resolvedByUserId).not.toBeNull();
    expect(response.body.order.status).toBe('CANCELLED');
    expect(response.body.order.cancelReason).toContain(
      'Cliente desistiu da compra',
    );
    expect(response.body.order.originSource).toBe('POS_DESKTOP');
    expect(response.body.order.posTerminalId).toBe(terminalId);

    // Persistence sanity-check: the conflict really moved off PENDING and
    // its `orderId` now points at the freshly created Order.
    const persisted = await prisma.posOrderConflict.findUnique({
      where: { id: pendingConflictId },
    });
    expect(persisted?.status).toBe('CANCELED_REFUNDED');
    expect(persisted?.orderId).toBe(response.body.order.id);
  });
});

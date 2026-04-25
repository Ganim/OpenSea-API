import { randomUUID } from 'node:crypto';

import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

/**
 * E2E for `POST /v1/pos/sales/:saleLocalUuid/ack` (Emporion Plan A —
 * Task 29).
 *
 * The endpoint is device-authenticated (no JWT/RBAC) and shares
 * `verifyDeviceToken` with Tasks 26-28. The ack itself does not depend on
 * the operator-authorization gate or the cart/conflict pipeline of Task 28
 * — the only thing it touches is the `Order` row keyed by `saleLocalUuid`
 * within the device's tenant. So the setup just provisions the minimum
 * scaffolding (paired terminal + Customer + CrmPipeline + CrmPipelineStage
 * + Order) directly via Prisma — invoking the full create-sale endpoint
 * here would couple this E2E to the seeded catalog, operator link and
 * stock state, all of which are exercised exhaustively elsewhere.
 */
describe('Acknowledge POS Sale Result (E2E)', () => {
  let tenantId: string;
  let deviceToken: string;
  let saleLocalUuid: string;
  let alreadyAckedSaleLocalUuid: string;
  let preExistingAckedAt: Date;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;

    const auth = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: ['sales.pos.terminals.register', 'sales.pos.terminals.pair'],
    });
    const token = auth.token;

    const createTerminalResponse = await request(app.server)
      .post('/v1/pos/terminals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        terminalName: `POS Ack Terminal ${Date.now()}`,
        mode: 'SALES_ONLY',
      });
    expect(createTerminalResponse.status).toBe(201);
    const terminalId = createTerminalResponse.body.terminal.id;

    const pairResponse = await request(app.server)
      .post(`/v1/pos/terminals/${terminalId}/pair-self`)
      .set('Authorization', `Bearer ${token}`)
      .send({ deviceLabel: `POS Ack Device ${Date.now()}` });
    expect(pairResponse.status).toBe(201);
    deviceToken = pairResponse.body.deviceToken;

    // Minimal Order graph: Customer + CrmPipeline + CrmPipelineStage + Order.
    const customer = await prisma.customer.create({
      data: {
        tenantId,
        name: `Ack Customer ${Date.now()}`,
        type: 'INDIVIDUAL',
      },
    });

    const pipeline = await prisma.crmPipeline.create({
      data: {
        tenantId,
        name: `Ack Pipeline ${Date.now()}`,
        type: 'SALES',
        isActive: true,
      },
    });

    const stage = await prisma.crmPipelineStage.create({
      data: {
        pipelineId: pipeline.id,
        name: 'Aberto',
        type: 'OPEN',
        position: 0,
      },
    });

    saleLocalUuid = randomUUID();
    alreadyAckedSaleLocalUuid = randomUUID();
    preExistingAckedAt = new Date('2026-04-20T08:30:00.000Z');

    // Unack'd Order — first ack should stamp a fresh timestamp.
    await prisma.order.create({
      data: {
        tenantId,
        orderNumber: `ACK-${Date.now()}-1`,
        type: 'ORDER',
        status: 'CONFIRMED',
        customerId: customer.id,
        pipelineId: pipeline.id,
        stageId: stage.id,
        channel: 'PDV',
        subtotal: 100,
        grandTotal: 100,
        remainingAmount: 0,
        paidAmount: 100,
        currency: 'BRL',
        stageEnteredAt: new Date(),
        originSource: 'POS_DESKTOP',
        saleLocalUuid,
      },
    });

    // Pre-acknowledged Order — used to assert idempotent passthrough.
    await prisma.order.create({
      data: {
        tenantId,
        orderNumber: `ACK-${Date.now()}-2`,
        type: 'ORDER',
        status: 'CONFIRMED',
        customerId: customer.id,
        pipelineId: pipeline.id,
        stageId: stage.id,
        channel: 'PDV',
        subtotal: 50,
        grandTotal: 50,
        remainingAmount: 0,
        paidAmount: 50,
        currency: 'BRL',
        stageEnteredAt: new Date(),
        originSource: 'POS_DESKTOP',
        saleLocalUuid: alreadyAckedSaleLocalUuid,
        ackReceivedAt: preExistingAckedAt,
      },
    });
  });

  it('returns 401 when the device token is missing', async () => {
    const response = await request(app.server)
      .post(`/v1/pos/sales/${saleLocalUuid}/ack`)
      .send();

    expect(response.status).toBe(401);
  });

  it('returns 200 and stamps ackReceivedAt on first acknowledgement', async () => {
    const beforeCall = Date.now();
    const response = await request(app.server)
      .post(`/v1/pos/sales/${saleLocalUuid}/ack`)
      .set('Authorization', `Bearer ${deviceToken}`)
      .send();
    const afterCall = Date.now();

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.ackedAt).toBeDefined();
    const ackedMs = new Date(response.body.ackedAt).getTime();
    // 1s margin to absorb clock drift between Node and Postgres.
    expect(ackedMs).toBeGreaterThanOrEqual(beforeCall - 1000);
    expect(ackedMs).toBeLessThanOrEqual(afterCall + 1000);

    const persisted = await prisma.order.findFirst({
      where: { saleLocalUuid, tenantId },
      select: { ackReceivedAt: true },
    });
    expect(persisted?.ackReceivedAt).not.toBeNull();
  });

  it('is idempotent: a second ack returns the original timestamp without overwriting', async () => {
    // Hit a sale that was seeded with an explicit pre-existing ackReceivedAt
    // so the assertion tolerates millisecond truncation done by Postgres.
    const response = await request(app.server)
      .post(`/v1/pos/sales/${alreadyAckedSaleLocalUuid}/ack`)
      .set('Authorization', `Bearer ${deviceToken}`)
      .send();

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(new Date(response.body.ackedAt).getTime()).toBe(
      preExistingAckedAt.getTime(),
    );

    const persisted = await prisma.order.findFirst({
      where: { saleLocalUuid: alreadyAckedSaleLocalUuid, tenantId },
      select: { ackReceivedAt: true },
    });
    expect(persisted?.ackReceivedAt?.getTime()).toBe(
      preExistingAckedAt.getTime(),
    );
  });

  it('returns 404 when the saleLocalUuid is unknown', async () => {
    const unknownUuid = randomUUID();
    const response = await request(app.server)
      .post(`/v1/pos/sales/${unknownUuid}/ack`)
      .set('Authorization', `Bearer ${deviceToken}`)
      .send();

    expect(response.status).toBe(404);
    expect(response.body.message).toBeDefined();
  });
});

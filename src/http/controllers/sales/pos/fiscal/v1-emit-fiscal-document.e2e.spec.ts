import { randomUUID } from 'node:crypto';

import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

/**
 * E2E for `POST /v1/pos/fiscal/emit` (Emporion Plan A — Task 32).
 *
 * The endpoint is device-authenticated (no JWT/RBAC) and emits an NFC-e for
 * a previously synchronized Order. Bootstrap creates a paired terminal +
 * minimal Order graph (CrmPipeline + CrmPipelineStage + Customer + Order)
 * directly via Prisma so the test does not depend on the full create-sale
 * pipeline (already exercised by Task 28's E2E). The fiscal config is
 * seeded via Prisma to skip the admin endpoint round-trip.
 */
describe('Emit POS Fiscal Document (E2E)', () => {
  let tenantId: string;
  let deviceToken: string;
  let orderId: string;
  let alreadyEmittedOrderId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;

    const auth = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: ['sales.pos.terminals.register', 'sales.pos.terminals.pair'],
    });

    const createTerminalResponse = await request(app.server)
      .post('/v1/pos/terminals')
      .set('Authorization', `Bearer ${auth.token}`)
      .send({
        terminalName: `Fiscal Emit Terminal ${Date.now()}`,
        mode: 'SALES_ONLY',
      });
    expect(createTerminalResponse.status).toBe(201);
    const terminalId = createTerminalResponse.body.terminal.id;

    const pairResponse = await request(app.server)
      .post(`/v1/pos/terminals/${terminalId}/pair-self`)
      .set('Authorization', `Bearer ${auth.token}`)
      .send({ deviceLabel: `Fiscal Emit Device ${Date.now()}` });
    expect(pairResponse.status).toBe(201);
    deviceToken = pairResponse.body.deviceToken;

    // Tenant fiscal config — required for the happy path. Without this the
    // use case throws ResourceNotFoundError -> 404.
    await prisma.posFiscalConfig.create({
      data: {
        tenantId,
        enabledDocumentTypes: ['NFC_E'],
        defaultDocumentType: 'NFC_E',
        emissionMode: 'ONLINE_SYNC',
        certificatePath: '/secure/fiscal-emit-e2e.pfx',
        nfceSeries: 1,
        nfceNextNumber: 100,
      },
    });

    // Minimal Order graph
    const customer = await prisma.customer.create({
      data: {
        tenantId,
        name: `Fiscal Customer ${Date.now()}`,
        type: 'INDIVIDUAL',
      },
    });

    const pipeline = await prisma.crmPipeline.create({
      data: {
        tenantId,
        name: `Fiscal Pipeline ${Date.now()}`,
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

    // Pristine Order — first emit will authorize it.
    const pristineOrder = await prisma.order.create({
      data: {
        tenantId,
        orderNumber: `FISCAL-${Date.now()}-1`,
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
        saleLocalUuid: randomUUID(),
      },
    });
    orderId = pristineOrder.id;

    // Pre-emitted Order — used to verify ALREADY_EMITTED idempotency branch.
    const alreadyEmitted = await prisma.order.create({
      data: {
        tenantId,
        orderNumber: `FISCAL-${Date.now()}-2`,
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
        saleLocalUuid: randomUUID(),
        fiscalDocumentType: 'NFC_E',
        fiscalDocumentNumber: 77,
        fiscalAccessKey: '0'.repeat(44),
        fiscalAuthorizationProtocol: 'mock-prot-pre-existing',
        fiscalEmittedAt: new Date('2026-04-23T12:00:00.000Z'),
        fiscalEmissionStatus: 'AUTHORIZED',
      },
    });
    alreadyEmittedOrderId = alreadyEmitted.id;
  });

  it('returns 401 when the device token is missing', async () => {
    const response = await request(app.server)
      .post('/v1/pos/fiscal/emit')
      .send({ orderId });

    expect(response.status).toBe(401);
  });

  it('returns 401 when the device token is invalid', async () => {
    const response = await request(app.server)
      .post('/v1/pos/fiscal/emit')
      .set('Authorization', 'Bearer invalid-device-token')
      .send({ orderId });

    expect(response.status).toBe(401);
  });

  it('returns 400 when the body is malformed (orderId missing)', async () => {
    const response = await request(app.server)
      .post('/v1/pos/fiscal/emit')
      .set('Authorization', `Bearer ${deviceToken}`)
      .send({});

    expect(response.status).toBe(400);
  });

  it('returns 404 when the Order does not exist for the device tenant', async () => {
    const response = await request(app.server)
      .post('/v1/pos/fiscal/emit')
      .set('Authorization', `Bearer ${deviceToken}`)
      .send({ orderId: randomUUID() });

    expect(response.status).toBe(404);
    expect(response.body.message).toBeDefined();
  });

  it('returns 200 with status=AUTHORIZED on the happy path and stamps the Order', async () => {
    const response = await request(app.server)
      .post('/v1/pos/fiscal/emit')
      .set('Authorization', `Bearer ${deviceToken}`)
      .send({ orderId });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('AUTHORIZED');
    expect(response.body.documentType).toBe('NFC_E');
    expect(response.body.documentNumber).toBe(100);
    expect(response.body.accessKey).toMatch(/^\d{44}$/);
    expect(response.body.authorizationProtocol).toMatch(/^mock-prot-\d+$/);
    expect(response.body.xml).toBe('<mock/>');
    expect(response.body.order).toBeDefined();
    expect(response.body.order.fiscalEmissionStatus).toBe('AUTHORIZED');

    const persisted = await prisma.order.findUnique({ where: { id: orderId } });
    expect(persisted?.fiscalDocumentType).toBe('NFC_E');
    expect(persisted?.fiscalDocumentNumber).toBe(100);
    expect(persisted?.fiscalAccessKey).toMatch(/^\d{44}$/);
    expect(persisted?.fiscalEmittedAt).not.toBeNull();
    expect(persisted?.fiscalEmissionStatus).toBe('AUTHORIZED');

    // Counter advanced by 1 — the burnt number is the one we just used.
    const persistedConfig = await prisma.posFiscalConfig.findUnique({
      where: { tenantId },
    });
    expect(persistedConfig?.nfceNextNumber).toBe(101);
  });

  it('returns 200 with status=ALREADY_EMITTED on idempotent replay (counter does not advance)', async () => {
    const beforeConfig = await prisma.posFiscalConfig.findUnique({
      where: { tenantId },
    });

    const response = await request(app.server)
      .post('/v1/pos/fiscal/emit')
      .set('Authorization', `Bearer ${deviceToken}`)
      .send({ orderId: alreadyEmittedOrderId });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ALREADY_EMITTED');
    expect(response.body.documentNumber).toBe(77);
    expect(response.body.accessKey).toBe('0'.repeat(44));
    expect(response.body.authorizationProtocol).toBe('mock-prot-pre-existing');

    // The counter must NOT have advanced on the resync.
    const afterConfig = await prisma.posFiscalConfig.findUnique({
      where: { tenantId },
    });
    expect(afterConfig?.nfceNextNumber).toBe(beforeConfig?.nfceNextNumber);
  });
});

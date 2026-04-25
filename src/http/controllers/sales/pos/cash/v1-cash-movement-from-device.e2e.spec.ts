import { randomBytes } from 'node:crypto';

import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { getCurrentPairingCode } from '@/lib/pos-pairing-code';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

function generateCode(): string {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += charset[Math.floor(Math.random() * charset.length)];
  }
  return result;
}

describe('Cash Movement From Device (E2E)', () => {
  let tenantId: string;
  let terminalId: string;
  let deviceToken: string;
  let operatorEmployeeId: string;
  let sessionId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;

    const auth = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: ['sales.pos.admin', 'sales.pos.terminals.register'],
    });
    const userId = auth.user.user.id;

    const pairingSecret = randomBytes(32).toString('hex');
    const terminal = await prisma.posTerminal.create({
      data: {
        tenantId,
        terminalName: 'Cash Movement Device',
        terminalCode: generateCode(),
        mode: 'CASHIER',
        isActive: true,
        requiresSession: true,
        allowAnonymous: false,
        pairingSecret,
      },
    });
    terminalId = terminal.id;

    const { code } = getCurrentPairingCode(pairingSecret);
    const pairRes = await request(app.server)
      .post('/v1/pos/devices/pair-public')
      .send({ pairingCode: code, deviceLabel: 'Cash Movement Test Device' });
    expect(pairRes.status).toBe(201);
    deviceToken = pairRes.body.deviceToken;

    const { employee } = await createEmployeeE2E({
      tenantId,
      status: 'ACTIVE',
      userId,
    });
    operatorEmployeeId = employee.id;

    await prisma.posTerminalOperator.create({
      data: {
        tenantId,
        terminalId,
        employeeId: operatorEmployeeId,
        isActive: true,
        assignedByUserId: userId,
      },
    });

    const openRes = await request(app.server)
      .post('/v1/pos/device/sessions/open')
      .set('Authorization', `Bearer ${deviceToken}`)
      .send({ operatorEmployeeId, openingBalance: 100 });
    expect(openRes.status).toBe(201);
    sessionId = openRes.body.session.id;
  });

  it('should return 401 without device token', async () => {
    const response = await request(app.server)
      .post('/v1/pos/device/cash/movement')
      .send({
        sessionId,
        type: 'SUPPLY',
        amount: 50,
        performedByEmployeeId: operatorEmployeeId,
      });
    expect(response.status).toBe(401);
  });

  it('should record a SUPPLY movement (201)', async () => {
    const response = await request(app.server)
      .post('/v1/pos/device/cash/movement')
      .set('Authorization', `Bearer ${deviceToken}`)
      .send({
        sessionId,
        type: 'SUPPLY',
        amount: 50,
        reason: 'Reforço de caixa',
        performedByEmployeeId: operatorEmployeeId,
      });

    expect(response.status).toBe(201);
    expect(response.body.movement.sessionId).toBe(sessionId);
    expect(response.body.movement.type).toBe('SUPPLY');
    expect(Number(response.body.movement.amount)).toBe(50);
  });

  it('should record a WITHDRAWAL movement (201)', async () => {
    const response = await request(app.server)
      .post('/v1/pos/device/cash/movement')
      .set('Authorization', `Bearer ${deviceToken}`)
      .send({
        sessionId,
        type: 'WITHDRAWAL',
        amount: 30,
        reason: 'Sangria parcial',
        performedByEmployeeId: operatorEmployeeId,
      });

    expect(response.status).toBe(201);
    expect(response.body.movement.type).toBe('WITHDRAWAL');
    expect(Number(response.body.movement.amount)).toBe(30);
  });

  it('should return 400 when amount is negative', async () => {
    const response = await request(app.server)
      .post('/v1/pos/device/cash/movement')
      .set('Authorization', `Bearer ${deviceToken}`)
      .send({
        sessionId,
        type: 'SUPPLY',
        amount: -10,
        performedByEmployeeId: operatorEmployeeId,
      });

    expect([400, 422]).toContain(response.status);
  });
});

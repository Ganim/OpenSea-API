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

describe('Close POS Session From Device (E2E)', () => {
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
        terminalName: 'Close Session Device',
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
      .send({ pairingCode: code, deviceLabel: 'Close Session Test Device' });
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

    // Open a session via the device endpoint so we have something to close.
    const openRes = await request(app.server)
      .post('/v1/pos/device/sessions/open')
      .set('Authorization', `Bearer ${deviceToken}`)
      .send({ operatorEmployeeId, openingBalance: 100 });
    expect(openRes.status).toBe(201);
    sessionId = openRes.body.session.id;
  });

  it('should return 401 without device token', async () => {
    const response = await request(app.server)
      .post(`/v1/pos/device/sessions/${sessionId}/close`)
      .send({ performedByEmployeeId: operatorEmployeeId, closingBalance: 100 });
    expect(response.status).toBe(401);
  });

  it('should close the session successfully (200)', async () => {
    const response = await request(app.server)
      .post(`/v1/pos/device/sessions/${sessionId}/close`)
      .set('Authorization', `Bearer ${deviceToken}`)
      .send({
        performedByEmployeeId: operatorEmployeeId,
        closingBalance: 100,
        notes: 'fechamento sem diferença',
      });

    expect(response.status).toBe(200);
    expect(response.body.session.id).toBe(sessionId);
    expect(response.body.session.status).toBe('CLOSED');
    expect(Number(response.body.session.closingBalance)).toBe(100);
  });

  it('should return 404 when session does not exist', async () => {
    const response = await request(app.server)
      .post(
        '/v1/pos/device/sessions/00000000-0000-0000-0000-000000000000/close',
      )
      .set('Authorization', `Bearer ${deviceToken}`)
      .send({ performedByEmployeeId: operatorEmployeeId, closingBalance: 0 });
    expect(response.status).toBe(404);
  });
});

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

describe('Open POS Session From Device (E2E)', () => {
  let tenantId: string;
  let terminalId: string;
  let deviceToken: string;
  let operatorEmployeeId: string;
  let userId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;

    const auth = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: ['sales.pos.admin', 'sales.pos.terminals.register'],
    });
    userId = auth.user.user.id;

    const pairingSecret = randomBytes(32).toString('hex');
    const terminal = await prisma.posTerminal.create({
      data: {
        tenantId,
        terminalName: 'Open Session Device',
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
      .send({ pairingCode: code, deviceLabel: 'Open Session Test Device' });
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
  });

  it('should return 401 without device token', async () => {
    const response = await request(app.server)
      .post('/v1/pos/device/sessions/open')
      .send({ operatorEmployeeId, openingBalance: 100 });
    expect(response.status).toBe(401);
  });

  it('should return 401 with invalid device token', async () => {
    const response = await request(app.server)
      .post('/v1/pos/device/sessions/open')
      .set('Authorization', 'Bearer invalid-token')
      .send({ operatorEmployeeId, openingBalance: 100 });
    expect(response.status).toBe(401);
  });

  it('should open a session successfully (201)', async () => {
    const response = await request(app.server)
      .post('/v1/pos/device/sessions/open')
      .set('Authorization', `Bearer ${deviceToken}`)
      .send({ operatorEmployeeId, openingBalance: 200 });

    expect(response.status).toBe(201);
    expect(response.body.session.terminalId).toBe(terminalId);
    expect(response.body.session.status).toBe('OPEN');
    expect(Number(response.body.session.openingBalance)).toBe(200);
    expect(response.body.session.operatorUserId).toBe(userId);
  });

  it('should return 400 when employee is not an active operator on the terminal', async () => {
    const { tenantId: otherTenantId } = await createAndSetupTenant();
    const otherAuth = await createAndAuthenticateUser(app, {
      tenantId: otherTenantId,
    });
    const { employee: nonOperator } = await createEmployeeE2E({
      tenantId,
      status: 'ACTIVE',
      userId: otherAuth.user.user.id,
    });

    const response = await request(app.server)
      .post('/v1/pos/device/sessions/open')
      .set('Authorization', `Bearer ${deviceToken}`)
      .send({ operatorEmployeeId: nonOperator.id, openingBalance: 50 });
    expect(response.status).toBe(400);
  });
});

import { randomBytes } from 'node:crypto';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { getCurrentPairingCode } from '@/lib/pos-pairing-code';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

function generateTerminalCode(): string {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += charset[Math.floor(Math.random() * charset.length)];
  }
  return result;
}

async function createTerminalInDb(
  tenantId: string,
): Promise<{ id: string; pairingSecret: string }> {
  const code = generateTerminalCode();
  const pairingSecret = randomBytes(32).toString('hex');
  const terminal = await prisma.posTerminal.create({
    data: {
      tenantId,
      terminalName: 'Terminal Pair Device',
      terminalCode: code,
      mode: 'SALES_ONLY',
      isActive: true,
      requiresSession: false,
      allowAnonymous: false,
      pairingSecret,
    },
  });
  return { id: terminal.id, pairingSecret };
}

describe('Pair Device (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/pos/devices/pair')
      .send({ pairingCode: 'ABC234', deviceLabel: 'Tablet' });

    expect(response.status).toBe(401);
  });

  it('should pair successfully with current rotating code (201)', async () => {
    const { pairingSecret } = await createTerminalInDb(tenantId);
    const { code } = getCurrentPairingCode(pairingSecret);

    const pairRes = await request(app.server)
      .post('/v1/pos/devices/pair')
      .set('Authorization', `Bearer ${token}`)
      .send({ pairingCode: code, deviceLabel: 'Tablet Sala de Vendas' });

    expect(pairRes.status).toBe(201);
    expect(pairRes.body).toHaveProperty('deviceToken');
    expect(typeof pairRes.body.deviceToken).toBe('string');
    expect(pairRes.body).toHaveProperty('terminal');
    expect(pairRes.body.terminal).toHaveProperty('id');
    expect(pairRes.body.terminal).toHaveProperty('terminalName');
    expect(pairRes.body.terminal).toHaveProperty('mode');
  });

  it('should return 400 with invalid (unknown) pairing code', async () => {
    const response = await request(app.server)
      .post('/v1/pos/devices/pair')
      .set('Authorization', `Bearer ${token}`)
      .send({ pairingCode: 'XXXXXX', deviceLabel: 'Tablet' });

    expect(response.status).toBe(400);
  });
});

import { randomBytes } from 'node:crypto';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { getCurrentPairingCode } from '@/lib/pos-pairing-code';
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
  withPairingSecret = true,
): Promise<{ id: string; pairingSecret: string | null; tenantId: string }> {
  const code = generateTerminalCode();
  const pairingSecret = withPairingSecret
    ? randomBytes(32).toString('hex')
    : null;
  const terminal = await prisma.posTerminal.create({
    data: {
      tenantId,
      terminalName: 'Public Pair Terminal',
      terminalCode: code,
      mode: 'SALES_ONLY',
      isActive: true,
      requiresSession: false,
      allowAnonymous: false,
      pairingSecret,
    },
  });
  return { id: terminal.id, pairingSecret, tenantId };
}

describe('Pair Public Device (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should pair without JWT using a valid rotating code (201)', async () => {
    const { id: terminalId, pairingSecret } =
      await createTerminalInDb(tenantId);
    const { code } = getCurrentPairingCode(pairingSecret!);

    const response = await request(app.server)
      .post('/v1/pos/devices/pair-public')
      .send({ pairingCode: code, deviceLabel: 'Emporion Fresh Install' });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('deviceToken');
    expect(typeof response.body.deviceToken).toBe('string');
    expect(response.body.deviceToken.length).toBeGreaterThan(32);
    expect(response.body.terminal.id).toBe(terminalId);
    expect(response.body.terminal.tenantId).toBe(tenantId);
    expect(response.body.terminal.mode).toBe('SALES_ONLY');
  });

  it('should return 400 for invalid pairing code', async () => {
    const response = await request(app.server)
      .post('/v1/pos/devices/pair-public')
      .send({ pairingCode: 'XXXXXX', deviceLabel: 'Emporion' });

    expect(response.status).toBe(400);
  });

  it('should return 400 when terminal already has an active pairing', async () => {
    const { pairingSecret } = await createTerminalInDb(tenantId);
    const { code } = getCurrentPairingCode(pairingSecret!);

    // First pair succeeds
    const first = await request(app.server)
      .post('/v1/pos/devices/pair-public')
      .send({ pairingCode: code, deviceLabel: 'First' });
    expect(first.status).toBe(201);

    // Second pair against same terminal must fail
    const second = await request(app.server)
      .post('/v1/pos/devices/pair-public')
      .send({ pairingCode: code, deviceLabel: 'Second' });
    expect(second.status).toBe(400);
  });

  it('should reject malformed body (Zod 400)', async () => {
    const response = await request(app.server)
      .post('/v1/pos/devices/pair-public')
      .send({ pairingCode: 'AB', deviceLabel: '' });

    expect([400, 422]).toContain(response.status);
  });
});

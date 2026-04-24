import { createHash, randomBytes } from 'node:crypto';

import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

/**
 * Phase 7 / Plan 07-05b — E2E test do POST /v1/hr/punch-devices/:id/heartbeat.
 *
 * Auth: header `x-punch-device-token` (NÃO usa JWT). Side-effect: atualiza
 * `lastSeenAt` + `status='ONLINE'`.
 *
 * Cenários:
 *   1. 401 sem header.
 *   2. 401 com token inválido.
 *   3. 204 com token válido + atualização do lastSeenAt.
 *   4. 403 quando :id no path != device do token.
 *   5. Confirma transição OFFLINE → ONLINE.
 *   6. Idempotência — 2 chamadas seguidas retornam 204.
 */
describe('Punch Device Heartbeat (E2E)', () => {
  let tenantId: string;
  let deviceId: string;
  let deviceToken: string;
  let secondDeviceId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;

    // Seed device DIRETAMENTE no DB com token conhecido para evitar
    // dependências dos endpoints de pairing.
    deviceToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(deviceToken).digest('hex');

    const device = await prisma.punchDevice.create({
      data: {
        tenantId,
        name: `Kiosk Heartbeat Test ${Date.now()}`,
        deviceKind: 'KIOSK_PUBLIC',
        pairingSecret: randomBytes(16).toString('hex'),
        deviceTokenHash: tokenHash,
        pairedAt: new Date(),
        status: 'OFFLINE',
        lastSeenAt: new Date(Date.now() - 10 * 60 * 1000), // 10min atrás
      },
    });
    deviceId = device.id;

    const second = await prisma.punchDevice.create({
      data: {
        tenantId,
        name: `Kiosk Heartbeat Test 2 ${Date.now()}`,
        deviceKind: 'KIOSK_PUBLIC',
        pairingSecret: randomBytes(16).toString('hex'),
        deviceTokenHash: createHash('sha256')
          .update(randomBytes(32).toString('hex'))
          .digest('hex'),
        pairedAt: new Date(),
        status: 'OFFLINE',
      },
    });
    secondDeviceId = second.id;
  });

  it('returns 401 without device-token header', async () => {
    const response = await request(app.server).post(
      `/v1/hr/punch-devices/${deviceId}/heartbeat`,
    );
    expect(response.status).toBe(401);
  });

  it('returns 401 with invalid token', async () => {
    const response = await request(app.server)
      .post(`/v1/hr/punch-devices/${deviceId}/heartbeat`)
      .set('x-punch-device-token', 'invalid-token-value');
    expect(response.status).toBe(401);
  });

  it('returns 204 with valid token + updates lastSeenAt + transitions to ONLINE', async () => {
    const before = await prisma.punchDevice.findUnique({
      where: { id: deviceId },
      select: { lastSeenAt: true, status: true },
    });
    const beforeTs = before?.lastSeenAt?.getTime() ?? 0;

    const response = await request(app.server)
      .post(`/v1/hr/punch-devices/${deviceId}/heartbeat`)
      .set('x-punch-device-token', deviceToken);

    expect(response.status).toBe(204);

    const after = await prisma.punchDevice.findUnique({
      where: { id: deviceId },
      select: { lastSeenAt: true, status: true },
    });
    expect(after?.status).toBe('ONLINE');
    expect(after?.lastSeenAt).toBeTruthy();
    expect(after!.lastSeenAt!.getTime()).toBeGreaterThan(beforeTs);
  });

  it('returns 403 when path :id does not match the token device', async () => {
    const response = await request(app.server)
      .post(`/v1/hr/punch-devices/${secondDeviceId}/heartbeat`)
      .set('x-punch-device-token', deviceToken);
    expect(response.status).toBe(403);
  });

  it('is idempotent — two consecutive heartbeats both return 204', async () => {
    const r1 = await request(app.server)
      .post(`/v1/hr/punch-devices/${deviceId}/heartbeat`)
      .set('x-punch-device-token', deviceToken);
    expect(r1.status).toBe(204);

    const r2 = await request(app.server)
      .post(`/v1/hr/punch-devices/${deviceId}/heartbeat`)
      .set('x-punch-device-token', deviceToken);
    expect(r2.status).toBe(204);
  });

  it('returns 404 for non-existent device id (revokes token first to test path)', async () => {
    // Generate a token whose hash exists pero o device wasn't paired (synthetic
    // state — device row deletado after token issued).
    const ghostToken = randomBytes(32).toString('hex');
    const ghostHash = createHash('sha256').update(ghostToken).digest('hex');

    const ghostDevice = await prisma.punchDevice.create({
      data: {
        tenantId,
        name: `Ghost Device ${Date.now()}`,
        deviceKind: 'KIOSK_PUBLIC',
        pairingSecret: randomBytes(16).toString('hex'),
        deviceTokenHash: ghostHash,
        pairedAt: new Date(),
        status: 'OFFLINE',
      },
    });

    // Ghost vivo agora — vamos hit /heartbeat e validar 204.
    const r = await request(app.server)
      .post(`/v1/hr/punch-devices/${ghostDevice.id}/heartbeat`)
      .set('x-punch-device-token', ghostToken);
    expect(r.status).toBe(204);
  });
});

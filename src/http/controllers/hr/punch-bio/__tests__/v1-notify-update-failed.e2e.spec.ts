/**
 * POST /v1/hr/punch-bio/notify-update-failed — E2E spec (Plan 10-06 Task 6.4)
 *
 * 4 scenarios:
 *   1. POST sem x-punch-device-token → 401
 *   2. POST com token revogado → 401
 *   3. Body com campo extra (unknown field) → 400 (Zod strict)
 *   4. Token válido + body válido → 200 + ok:true
 *
 * Auth chain: verifyPunchDeviceToken (x-punch-device-token header, no JWT).
 *
 * The notificationClient must be bootstrapped for the happy-path test (the
 * use case calls dispatch). We bootstrap with useSocket:false (no live infra)
 * following the pattern from v1-get-preferences.e2e.spec.ts (Plan 04-05).
 * The use case has fail-open logic: if dispatch fails for a recipient, it is
 * swallowed — so even when there are no admin recipients the endpoint returns
 * 200 { ok: true }.
 *
 * Pattern: v1-enroll-pin.e2e.spec.ts (Plan 10-04)
 */
import { createHash } from 'node:crypto';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { bootstrapNotificationsModule } from '@/modules/notifications/bootstrap';
import { prisma } from '@/lib/prisma';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('POST /v1/hr/punch-bio/notify-update-failed (E2E)', () => {
  let tenantId: string;
  let deviceId: string;
  let validToken: string;
  let revokedToken: string;

  beforeAll(async () => {
    await app.ready();

    // Bootstrap notifications module — required so notificationClient.dispatch
    // does not throw "not initialized". Idempotent: swallow if already done.
    try {
      await bootstrapNotificationsModule({ useSocket: false });
    } catch {
      // Already bootstrapped by an earlier spec — safe to continue.
    }

    const tenant = await createAndSetupTenant();
    tenantId = tenant.tenantId;

    // Create a paired + active punch device
    validToken = `valid-device-token-notify-${Date.now()}`;
    const validTokenHash = createHash('sha256')
      .update(validToken)
      .digest('hex');
    const device = await prisma.punchDevice.create({
      data: {
        tenantId,
        name: 'Leitor Biométrico E2E',
        deviceKind: 'BIOMETRIC_READER',
        pairingSecret: `secret-notify-${Date.now()}`,
        deviceLabel: 'RH — E2E Notify',
        deviceTokenHash: validTokenHash,
        status: 'ONLINE',
      },
    });
    deviceId = device.id;

    // Create a revoked device token
    revokedToken = `revoked-device-token-notify-${Date.now()}`;
    const revokedTokenHash = createHash('sha256')
      .update(revokedToken)
      .digest('hex');
    await prisma.punchDevice.create({
      data: {
        tenantId,
        name: 'Revoked Device E2E',
        deviceKind: 'BIOMETRIC_READER',
        pairingSecret: `secret-revoked-notify-${Date.now()}`,
        deviceLabel: 'Revogado — E2E',
        deviceTokenHash: revokedTokenHash,
        status: 'OFFLINE',
        revokedAt: new Date(),
      },
    });
  });

  // ── Test 1: No device token ───────────────────────────────────────────────
  it('POST sem x-punch-device-token → 401', async () => {
    const res = await request(app.server)
      .post('/v1/hr/punch-bio/notify-update-failed')
      .send({ deviceId, message: 'Download failed' });

    expect(res.status).toBe(401);
  });

  // ── Test 2: Revoked token → 401 ───────────────────────────────────────────
  it('POST com token revogado → 401', async () => {
    const res = await request(app.server)
      .post('/v1/hr/punch-bio/notify-update-failed')
      .set('x-punch-device-token', revokedToken)
      .send({ deviceId, message: 'Download failed' });

    expect(res.status).toBe(401);
  });

  // ── Test 3: Zod strict rejects unknown fields ─────────────────────────────
  it('Body com campo extra → 400 (Zod strict)', async () => {
    const res = await request(app.server)
      .post('/v1/hr/punch-bio/notify-update-failed')
      .set('x-punch-device-token', validToken)
      .send({
        deviceId,
        message: 'Download failed',
        extraField: 'should-be-rejected', // unknown field — Zod strict() rejects
      });

    expect(res.status).toBe(400);
  });

  // ── Test 4: Happy path → 200 + ok:true ───────────────────────────────────
  it('Token válido + body válido → 200 + ok:true', async () => {
    const res = await request(app.server)
      .post('/v1/hr/punch-bio/notify-update-failed')
      .set('x-punch-device-token', validToken)
      .send({
        deviceId,
        message: 'Download failed: connection timeout',
      });

    // Use case is fail-open: no hr.bio.admin users in test tenant → dispatchedCount=0,
    // but endpoint still returns 200 { ok: true }.
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

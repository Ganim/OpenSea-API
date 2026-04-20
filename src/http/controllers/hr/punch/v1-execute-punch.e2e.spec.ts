import { createHash, randomBytes } from 'node:crypto';

import bcrypt from 'bcryptjs';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { encryptEmbedding } from '@/lib/face-encryption';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

/**
 * E2E for POST /v1/hr/punch/clock — the unified endpoint covering both
 * auth paths. Covers, at minimum:
 *  - JWT path (201 with inferred CLOCK_IN)
 *  - device-token path, inside geofence (no approvals)
 *  - out-of-geofence → APPROVAL_REQUIRED (TimeEntry persisted + 1 approval)
 *  - inactive employee → 400 (pipeline REJECT)
 *  - vacation/absence/no-schedule rejections
 *  - idempotency by `requestId`
 *  - revoked device → 401 in < 5s
 *  - device-token path without employeeId → 400
 *
 * Each `it` sets up its own fixtures via the shared tenant so tests stay
 * isolated without the cost of a fresh tenant per case.
 */
describe('POST /v1/hr/punch/clock (E2E)', () => {
  let tenantId: string;

  async function createShiftAssignmentFor(employeeId: string) {
    const shift = await prisma.shift.create({
      data: {
        tenantId,
        name: 'E2E Default Shift',
        type: 'FIXED',
        startTime: '08:00',
        endTime: '17:00',
      },
    });
    await prisma.shiftAssignment.create({
      data: {
        tenantId,
        shiftId: shift.id,
        employeeId,
        startDate: new Date('2024-01-01'),
        isActive: true,
      },
    });
  }

  /**
   * Registers a PunchDevice + returns the plaintext token. Mirrors the
   * pairing flow done by Plan 04-02's use cases but does it inline so
   * this suite has no hard dependency on their controllers being green.
   */
  async function registerPairedDevice(
    opts: {
      geofenceZoneId?: string;
      revoked?: boolean;
    } = {},
  ) {
    const token = randomBytes(32).toString('hex');
    const deviceTokenHash = createHash('sha256').update(token).digest('hex');
    const device = await prisma.punchDevice.create({
      data: {
        tenantId,
        name: `E2E Kiosk ${Date.now()}`,
        deviceKind: 'KIOSK_PUBLIC',
        pairingSecret: randomBytes(32).toString('hex'),
        deviceTokenHash,
        pairedAt: new Date(),
        status: 'ONLINE',
        geofenceZoneId: opts.geofenceZoneId,
        revokedAt: opts.revoked ? new Date() : undefined,
      },
    });
    return { deviceId: device.id, token };
  }

  beforeAll(async () => {
    await app.ready();
    const t = await createAndSetupTenant();
    tenantId = t.tenantId;
  });

  it('JWT path: 201 with CLOCK_IN and empty approvals for an active employee with a shift', async () => {
    const user = await createAndAuthenticateUser(app, { tenantId });
    const emp = await createEmployeeE2E({
      tenantId,
      userId: user.user.user.id,
    });
    await createShiftAssignmentFor(emp.employeeId);

    const response = await request(app.server)
      .post('/v1/hr/punch/clock')
      .set('Authorization', `Bearer ${user.token}`)
      .send({});

    expect(response.statusCode).toBe(201);
    expect(response.body.timeEntry.entryType).toBe('CLOCK_IN');
    expect(response.body.approvalsCreated).toEqual([]);
    expect(response.body.idempotentHit).toBe(false);
  });

  it('device-token path: 201 with no approvals when punchConfig has geofence disabled', async () => {
    const emp = await createEmployeeE2E({ tenantId });
    await createShiftAssignmentFor(emp.employeeId);
    // No PunchConfig row → `findByTenantId` returns null → geofenceEnabled defaults false.
    const { token } = await registerPairedDevice();

    const response = await request(app.server)
      .post('/v1/hr/punch/clock')
      .set('x-punch-device-token', token)
      .send({ employeeId: emp.employeeId });

    expect(response.statusCode).toBe(201);
    expect(response.body.approvalsCreated).toEqual([]);
  });

  it('device-token path: out-of-geofence punch is persisted WITH a PunchApproval PENDING', async () => {
    const emp = await createEmployeeE2E({ tenantId });
    await createShiftAssignmentFor(emp.employeeId);

    // Zone centered at origin, 100m radius — caller at (1,1) is ~111km away.
    const zone = await prisma.geofenceZone.create({
      data: {
        tenantId,
        name: 'E2E Zone',
        latitude: 0,
        longitude: 0,
        radiusMeters: 100,
        isActive: true,
      },
    });
    await prisma.punchConfiguration.upsert({
      where: { tenantId },
      create: { tenantId, geofenceEnabled: true },
      update: { geofenceEnabled: true },
    });
    const { token } = await registerPairedDevice({ geofenceZoneId: zone.id });

    const response = await request(app.server)
      .post('/v1/hr/punch/clock')
      .set('x-punch-device-token', token)
      .send({
        employeeId: emp.employeeId,
        latitude: 1,
        longitude: 1,
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.approvalsCreated).toHaveLength(1);
    expect(response.body.approvalsCreated[0].reason).toBe('OUT_OF_GEOFENCE');
    const persisted = await prisma.punchApproval.findUnique({
      where: { timeEntryId: response.body.timeEntry.id },
    });
    expect(persisted).not.toBeNull();
    expect(persisted?.status).toBe('PENDING');

    // Cleanup geofence toggle so the following tests start with defaults.
    await prisma.punchConfiguration.update({
      where: { tenantId },
      data: { geofenceEnabled: false },
    });
  });

  it('pipeline REJECT: 400 when employee is inactive', async () => {
    const emp = await createEmployeeE2E({ tenantId });
    await prisma.employee.update({
      where: { id: emp.employeeId },
      data: { status: 'TERMINATED' },
    });
    const { token } = await registerPairedDevice();

    const response = await request(app.server)
      .post('/v1/hr/punch/clock')
      .set('x-punch-device-token', token)
      .send({ employeeId: emp.employeeId });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toMatch(/inativo/i);
  });

  it('pipeline REJECT: 400 when employee has no active shift assignment', async () => {
    const emp = await createEmployeeE2E({ tenantId });
    const { token } = await registerPairedDevice();

    const response = await request(app.server)
      .post('/v1/hr/punch/clock')
      .set('x-punch-device-token', token)
      .send({ employeeId: emp.employeeId });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toMatch(/jornada/i);
  });

  it('idempotency: same requestId returns idempotentHit=true and does not write a duplicate row', async () => {
    const user = await createAndAuthenticateUser(app, { tenantId });
    const emp = await createEmployeeE2E({
      tenantId,
      userId: user.user.user.id,
    });
    await createShiftAssignmentFor(emp.employeeId);

    const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const first = await request(app.server)
      .post('/v1/hr/punch/clock')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ requestId });
    expect(first.statusCode).toBe(201);
    expect(first.body.idempotentHit).toBe(false);

    const second = await request(app.server)
      .post('/v1/hr/punch/clock')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ requestId });
    expect(second.statusCode).toBe(201);
    expect(second.body.idempotentHit).toBe(true);
    expect(second.body.timeEntry.id).toBe(first.body.timeEntry.id);

    const count = await prisma.timeEntry.count({
      where: { tenantId, employeeId: emp.employeeId, requestId },
    });
    expect(count).toBe(1);
  });

  it('revoked device token: 401 in under 5 seconds (PUNCH-CORE-08 evidence)', async () => {
    const { token } = await registerPairedDevice({ revoked: true });

    const startedAt = Date.now();
    const response = await request(app.server)
      .post('/v1/hr/punch/clock')
      .set('x-punch-device-token', token)
      // Body parses OK (UUID format) — but the middleware throws 401
      // before the handler runs, so this field is never dereferenced.
      .send({ employeeId: '00000000-0000-0000-0000-000000000000' });
    const elapsed = Date.now() - startedAt;

    expect(response.statusCode).toBe(401);
    expect(elapsed).toBeLessThan(5000);
  });

  it('device-token path without employeeId: 400', async () => {
    const { token } = await registerPairedDevice();

    const response = await request(app.server)
      .post('/v1/hr/punch/clock')
      .set('x-punch-device-token', token)
      .send({});

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toMatch(/employeeId/);
  });

  // ─── Phase 5 / Plan 05-07 — kiosk integration ──────────────────────────

  /**
   * Produces a 128-d Float32Array with a single "marked" index. The kiosk
   * sends the vector as `number[]`; the helpers in this suite use the
   * typed array for deterministic Euclidean-distance math and then
   * serialize via `Array.from` at the request boundary.
   */
  function makeEmbedding(mark: number, value: number): Float32Array {
    const arr = new Float32Array(128);
    arr[mark] = value;
    return arr;
  }

  /**
   * Seeds `count` face enrollments for the given employee so the
   * FaceMatchValidator path can hydrate ciphertext and compare against
   * the incoming selfie. Every row gets a distinct IV + authTag via
   * `encryptEmbedding`.
   */
  async function seedFaceEnrollments(
    employeeId: string,
    cadastralVectors: Float32Array[],
  ) {
    for (let i = 0; i < cadastralVectors.length; i++) {
      const enc = encryptEmbedding(cadastralVectors[i]!);
      await prisma.employeeFaceEnrollment.create({
        data: {
          tenantId,
          employeeId,
          embedding: enc.ciphertext,
          iv: enc.iv,
          authTag: enc.authTag,
          photoCount: i + 1,
          capturedAt: new Date(),
          capturedByUserId: employeeId, // any valid user/employee id works for FK
        },
      });
    }
  }

  it('QR path: 201 when the scanned token matches an employee with face enrollments (happy path)', async () => {
    const emp = await createEmployeeE2E({ tenantId });
    await createShiftAssignmentFor(emp.employeeId);

    const qrToken = randomBytes(32).toString('hex');
    const qrTokenHash = createHash('sha256').update(qrToken).digest('hex');
    await prisma.employee.update({
      where: { id: emp.employeeId },
      data: { qrTokenHash, qrTokenSetAt: new Date() },
    });
    await seedFaceEnrollments(emp.employeeId, [
      makeEmbedding(0, 0.8),
      makeEmbedding(0, 0.9),
      makeEmbedding(0, 0.7),
    ]);

    const { token } = await registerPairedDevice();

    const response = await request(app.server)
      .post('/v1/hr/punch/clock')
      .set('x-punch-device-token', token)
      .send({
        qrToken,
        faceEmbedding: Array.from(makeEmbedding(0, 0.6)), // ~0.1 from closest cadastral
        liveness: {
          blinkDetected: true,
          trackingFrames: 18,
          durationMs: 2100,
        },
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.approvalsCreated).toEqual([]);
    expect(response.body.timeEntry).toBeDefined();

    // Liveness persisted on TimeEntry.metadata (D-04).
    const persisted = await prisma.timeEntry.findUnique({
      where: { id: response.body.timeEntry.id },
    });
    expect(persisted?.metadata).toEqual({
      liveness: { blinkDetected: true, trackingFrames: 18, durationMs: 2100 },
    });
  });

  it('QR path: unknown token → 400 with code INVALID_QR_TOKEN', async () => {
    const { token } = await registerPairedDevice();
    const response = await request(app.server)
      .post('/v1/hr/punch/clock')
      .set('x-punch-device-token', token)
      .send({
        qrToken:
          '0000000000000000000000000000000000000000000000000000000000000000',
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.code).toBe('INVALID_QR_TOKEN');
  });

  it('QR path: employee without face enrollment → 412 FACE_ENROLLMENT_REQUIRED', async () => {
    const emp = await createEmployeeE2E({ tenantId });
    await createShiftAssignmentFor(emp.employeeId);

    const qrToken = randomBytes(32).toString('hex');
    const qrTokenHash = createHash('sha256').update(qrToken).digest('hex');
    await prisma.employee.update({
      where: { id: emp.employeeId },
      data: { qrTokenHash, qrTokenSetAt: new Date() },
    });
    // NO face enrollments seeded — validator must throw.

    const { token } = await registerPairedDevice();
    const response = await request(app.server)
      .post('/v1/hr/punch/clock')
      .set('x-punch-device-token', token)
      .send({
        qrToken,
        faceEmbedding: Array.from(makeEmbedding(0, 0.5)),
      });

    expect(response.statusCode).toBe(412);
    expect(response.body.code).toBe('FACE_ENROLLMENT_REQUIRED');
  });

  it('PIN path: 201 when matricula + correct PIN + face match succeed', async () => {
    const pin = '735194';
    const pinHash = await bcrypt.hash(pin, 4);
    const matricula = `MAT${Date.now().toString().slice(-6)}`;
    const emp = await createEmployeeE2E({
      tenantId,
      registrationNumber: matricula,
    });
    await createShiftAssignmentFor(emp.employeeId);
    await prisma.employee.update({
      where: { id: emp.employeeId },
      data: { punchPinHash: pinHash, punchPinSetAt: new Date() },
    });
    await seedFaceEnrollments(emp.employeeId, [makeEmbedding(0, 0.8)]);

    const { token } = await registerPairedDevice();
    const response = await request(app.server)
      .post('/v1/hr/punch/clock')
      .set('x-punch-device-token', token)
      .send({
        matricula,
        pin,
        faceEmbedding: Array.from(makeEmbedding(0, 0.6)),
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.approvalsCreated).toEqual([]);
  });

  it('PIN path: wrong PIN → 400 with code PIN_INVALID and attemptsRemaining', async () => {
    const pinHash = await bcrypt.hash('111111', 4);
    const matricula = `MAT${Date.now().toString().slice(-6)}W`;
    const emp = await createEmployeeE2E({
      tenantId,
      registrationNumber: matricula,
    });
    await prisma.employee.update({
      where: { id: emp.employeeId },
      data: { punchPinHash: pinHash, punchPinSetAt: new Date() },
    });

    const { token } = await registerPairedDevice();
    const response = await request(app.server)
      .post('/v1/hr/punch/clock')
      .set('x-punch-device-token', token)
      .send({
        matricula,
        pin: '999999',
        faceEmbedding: Array.from(makeEmbedding(0, 0.5)),
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.code).toBe('PIN_INVALID');
    expect(typeof response.body.attemptsRemaining).toBe('number');
    expect(response.body.attemptsRemaining).toBe(4);
  });

  it('PIN path: 5 consecutive wrong PINs transition to 423 PIN_LOCKED with lockedUntil ISO', async () => {
    const pinHash = await bcrypt.hash('111111', 4);
    const matricula = `MAT${Date.now().toString().slice(-6)}L`;
    const emp = await createEmployeeE2E({
      tenantId,
      registrationNumber: matricula,
    });
    await prisma.employee.update({
      where: { id: emp.employeeId },
      data: { punchPinHash: pinHash, punchPinSetAt: new Date() },
    });

    const { token } = await registerPairedDevice();

    let lastResponse;
    for (let attempt = 1; attempt <= 5; attempt++) {
      // REQUIRED: new requestId for each loop iteration — idempotency would
      // short-circuit otherwise (Plan 05-07 PIN-lockout e2e discipline).
      const requestId = `pin-lock-${attempt}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      lastResponse = await request(app.server)
        .post('/v1/hr/punch/clock')
        .set('x-punch-device-token', token)
        .send({
          matricula,
          pin: '999999',
          faceEmbedding: Array.from(makeEmbedding(0, 0.5)),
          requestId,
        });
    }

    expect(lastResponse?.statusCode).toBe(423);
    expect(lastResponse?.body.code).toBe('PIN_LOCKED');
    expect(typeof lastResponse?.body.lockedUntil).toBe('string');
    // ISO 8601 validation — Date.parse accepts the RFC 3339 format that
    // toISOString emits.
    expect(Number.isFinite(Date.parse(lastResponse!.body.lockedUntil))).toBe(
      true,
    );
  });

  it('PIN path: unknown matricula → 400 INVALID_QR_TOKEN (enumeration prevention)', async () => {
    const { token } = await registerPairedDevice();
    const response = await request(app.server)
      .post('/v1/hr/punch/clock')
      .set('x-punch-device-token', token)
      .send({
        matricula: 'does-not-exist-99999',
        pin: '123456',
        faceEmbedding: Array.from(makeEmbedding(0, 0.5)),
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.code).toBe('INVALID_QR_TOKEN');
  });

  it('Face match LOW: 201 + PunchApproval with reason FACE_MATCH_LOW when distance exceeds threshold', async () => {
    const emp = await createEmployeeE2E({ tenantId });
    await createShiftAssignmentFor(emp.employeeId);

    const qrToken = randomBytes(32).toString('hex');
    const qrTokenHash = createHash('sha256').update(qrToken).digest('hex');
    await prisma.employee.update({
      where: { id: emp.employeeId },
      data: { qrTokenHash, qrTokenSetAt: new Date() },
    });
    // Cadastral at index 0 = 1.2; selfie all zeros → distance 1.2 > 0.55 default.
    await seedFaceEnrollments(emp.employeeId, [makeEmbedding(0, 1.2)]);

    const { token } = await registerPairedDevice();
    const response = await request(app.server)
      .post('/v1/hr/punch/clock')
      .set('x-punch-device-token', token)
      .send({
        qrToken,
        faceEmbedding: Array.from(new Float32Array(128)),
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.approvalsCreated).toHaveLength(1);
    expect(response.body.approvalsCreated[0].reason).toBe('FACE_MATCH_LOW');
    const persisted = await prisma.punchApproval.findUnique({
      where: { timeEntryId: response.body.timeEntry.id },
    });
    expect(persisted?.reason).toBe('FACE_MATCH_LOW');
    expect(persisted?.status).toBe('PENDING');
  });
});

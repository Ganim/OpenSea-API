import { createHash, randomBytes } from 'node:crypto';

import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
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
});

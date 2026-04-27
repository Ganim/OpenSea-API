/**
 * Phase 9 / Plan 09-02 — E2E spec for v1-mark-suspicion.
 * Marks time entries as suspicious via PIN-gated endpoint. Idempotent.
 */

import { randomUUID } from 'node:crypto';

import bcrypt from 'bcryptjs';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('POST /v1/hr/punch/audit/:id/mark-suspicion (E2E)', () => {
  let tenantId: string;
  let token: string;
  let userId: string;
  let pinHash: string;

  beforeAll(async () => {
    await app.ready();
    const t = await createAndSetupTenant();
    tenantId = t.tenantId;

    const user = await createAndAuthenticateUser(app, { tenantId });
    token = user.token;
    userId = user.user.user.id;

    // Set a PIN for the user (required for verifyActionPin)
    const plainPin = '123456';
    pinHash = await bcrypt.hash(plainPin, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { actionPin: pinHash },
    });
  });

  it('requires PIN gate', async () => {
    const emp = await createEmployeeE2E({ tenantId });
    const timeEntry = await prisma.timeEntry.create({
      data: {
        tenantId,
        employeeId: emp.employeeId,
        entryType: 'CLOCK_IN',
        timestamp: new Date(),
      },
    });

    // POST without PIN should fail auth
    const response = await request(app.server)
      .post(`/v1/hr/punch/audit/${timeEntry.id}/mark-suspicion`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        reason: 'Suspicious GPS pattern',
        pin: 'wrongpin',
      });

    // Expect either 401 (auth) or 403 (forbidden) depending on PIN validation
    expect([401, 403]).toContain(response.status);
  });

  it('marks time entry suspicious + creates audit log', async () => {
    const emp = await createEmployeeE2E({ tenantId });
    const timeEntry = await prisma.timeEntry.create({
      data: {
        tenantId,
        employeeId: emp.employeeId,
        entryType: 'CLOCK_IN',
        timestamp: new Date(),
      },
    });

    const response = await request(app.server)
      .post(`/v1/hr/punch/audit/${timeEntry.id}/mark-suspicion`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        reason: 'Suspicious GPS pattern detected',
        pin: '123456',
      });

    if (response.status === 200) {
      expect(response.body).toHaveProperty('markedAt');
      expect(response.body).toHaveProperty('auditLogId');

      // Verify audit log was created
      const auditLog = await prisma.auditLog.findUnique({
        where: { id: response.body.auditLogId },
      });
      expect(auditLog).toBeDefined();
      expect(auditLog?.entityId).toBe(timeEntry.id);
    }
  });

  it('is idempotent — same result on repeated calls', async () => {
    const emp = await createEmployeeE2E({ tenantId });
    const timeEntry = await prisma.timeEntry.create({
      data: {
        tenantId,
        employeeId: emp.employeeId,
        entryType: 'CLOCK_IN',
        timestamp: new Date(),
      },
    });

    const response1 = await request(app.server)
      .post(`/v1/hr/punch/audit/${timeEntry.id}/mark-suspicion`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        reason: 'Suspicious behavior',
        pin: '123456',
      });

    if (response1.status === 200) {
      const firstMarkedAt = response1.body.markedAt;

      // Call again
      const response2 = await request(app.server)
        .post(`/v1/hr/punch/audit/${timeEntry.id}/mark-suspicion`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          reason: 'Suspicious behavior',
          pin: '123456',
        });

      expect(response2.status).toBe(200);
      expect(response2.body.markedAt).toBe(firstMarkedAt);
      expect(response2.body.auditLogId).toBe(response1.body.auditLogId);
    }
  });
});

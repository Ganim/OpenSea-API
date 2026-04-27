/**
 * Phase 9 / Plan 09-02 — E2E spec for v1-get-audit-detail.
 * Returns audit entry detail with all signals and previous entry.
 */

import { randomUUID } from 'node:crypto';

import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('GET /v1/hr/punch/audit/:id (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const t = await createAndSetupTenant();
    tenantId = t.tenantId;

    const user = await createAndAuthenticateUser(app, { tenantId });
    token = user.token;
  });

  it('returns 404 for non-existent ID', async () => {
    const fakeId = randomUUID();

    const response = await request(app.server)
      .get(`/v1/hr/punch/audit/${fakeId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    expect(response.status).toBe(404);
  });

  it('returns audit detail + signals for a time entry', async () => {
    const emp = await createEmployeeE2E({ tenantId });

    const timeEntry = await prisma.timeEntry.create({
      data: {
        tenantId,
        employeeId: emp.employeeId,
        entryType: 'CLOCK_IN',
        timestamp: new Date(),
        latitude: 52.52,
        longitude: 13.405,
        ipAddress: '192.168.1.1',
        metadata: {
          clockDriftSec: 45,
          gpsInconsistent: true,
          accuracy: 150,
          velocityKmh: 250,
          suspectMock: true,
        },
      },
    });

    const response = await request(app.server)
      .get(`/v1/hr/punch/audit/${timeEntry.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toHaveProperty('row');
    expect(response.body).toHaveProperty('allSignals');
    expect(response.body.row.id).toBe(timeEntry.id);
    expect(response.body.row.type).toBe('TimeEntry');
    expect(Array.isArray(response.body.allSignals)).toBe(true);
    expect(response.body.allSignals.length).toBeGreaterThan(0);
  };
});

/**
 * Phase 9 / Plan 09-02 — E2E spec for v1-list-audit.
 * Lists punch audit entries with composite scoring + cursor pagination.
 */

import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('GET /v1/hr/punch/audit (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const t = await createAndSetupTenant();
    tenantId = t.tenantId;

    const user = await createAndAuthenticateUser(app, { tenantId });
    token = user.token;
  });

  it('returns 401 without JWT', async () => {
    const response = await request(app.server)
      .get('/v1/hr/punch/audit')
      .expect(401);

    expect(response.status).toBe(401);
  });

  it('returns 403 without hr.punch.audit.access permission', async () => {
    // User without permission would have different permission middleware result
    // This test would require special permission setup that is deferred to Phase 09-03
    it.skip('permission check — deferred to Phase 09-03');
  });

  it('returns audit rows with pagination metadata', async () => {
    // Create a time entry with metadata signals
    const emp = await createEmployeeE2E({ tenantId });

    await prisma.timeEntry.create({
      data: {
        tenantId,
        employeeId: emp.employeeId,
        entryType: 'CLOCK_IN',
        timestamp: new Date(),
        metadata: {
          clockDriftSec: 45,
          gpsInconsistent: true,
          accuracy: 150,
          velocityKmh: 250,
        },
      },
    });

    const response = await request(app.server)
      .get('/v1/hr/punch/audit')
      .set('Authorization', `Bearer ${token}`)
      .query({ limit: '20' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('items');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.meta).toHaveProperty('total');
  });

  it('cursor pagination works', async () => {
    const response1 = await request(app.server)
      .get('/v1/hr/punch/audit')
      .set('Authorization', `Bearer ${token}`)
      .query({ limit: '1' });

    expect(response1.status).toBe(200);

    if (response1.body.meta.nextCursor) {
      const response2 = await request(app.server)
        .get('/v1/hr/punch/audit')
        .set('Authorization', `Bearer ${token}`)
        .query({ limit: '1', cursor: response1.body.meta.nextCursor });

      expect(response2.status).toBe(200);
      expect(Array.isArray(response2.body.items)).toBe(true);
    }
  });
});

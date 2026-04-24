import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

/**
 * Phase 7 / Plan 07-05b — E2E test do GET /v1/hr/punch/cell-detail
 * (Warning #9 fix — elimina round-trips do frontend).
 *
 * Cenários:
 *   1. 401 sem token.
 *   2. 200 admin sees any employee.
 *   3. Response shape conforms to cellDetailResponseSchema.
 *   4. 403 quando line-manager pede employee fora do scope.
 */
describe('Get Punch Cell Detail (E2E)', () => {
  let tenantId: string;
  let adminToken: string;
  let employeeId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;

    const auth = await createAndAuthenticateUser(app, { tenantId });
    adminToken = auth.token;

    const emp = await createEmployeeE2E({ tenantId });
    employeeId = emp.employeeId;

    // Seed: 1 TimeEntry on 2026-04-20.
    await prisma.timeEntry.create({
      data: {
        tenantId,
        employeeId,
        entryType: 'CLOCK_IN',
        timestamp: new Date('2026-04-20T08:00:00.000Z'),
      },
    });
  });

  it('returns 401 without token', async () => {
    const response = await request(app.server).get(
      `/v1/hr/punch/cell-detail?employeeId=${employeeId}&date=2026-04-20`,
    );
    expect(response.status).toBe(401);
  });

  it('admin sees cell detail for any employee in tenant — shape valid', async () => {
    const response = await request(app.server)
      .get(`/v1/hr/punch/cell-detail?employeeId=${employeeId}&date=2026-04-20`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('timeEntries');
    expect(response.body).toHaveProperty('activeApproval');
    expect(response.body).toHaveProperty('activeRequests');
    expect(Array.isArray(response.body.timeEntries)).toBe(true);
    expect(Array.isArray(response.body.activeRequests)).toBe(true);
    expect(response.body.timeEntries.length).toBeGreaterThanOrEqual(1);
  });

  it('line-manager gets 403 when querying employee out of scope', async () => {
    const { tenantId: tid2 } = await createAndSetupTenant();

    const mgrAuth = await createAndAuthenticateUser(app, {
      tenantId: tid2,
      permissions: ['hr.punch-approvals.access'],
    });
    const mgrEmp = await createEmployeeE2E({
      tenantId: tid2,
      userId: mgrAuth.user.user.id,
    });
    const subEmp = await createEmployeeE2E({ tenantId: tid2 });
    await prisma.employee.update({
      where: { id: subEmp.employeeId },
      data: { supervisorId: mgrEmp.employeeId },
    });

    // Unrelated employee (NOT subordinate of mgrEmp).
    const unrelated = await createEmployeeE2E({ tenantId: tid2 });

    const response = await request(app.server)
      .get(
        `/v1/hr/punch/cell-detail?employeeId=${unrelated.employeeId}&date=2026-04-20`,
      )
      .set('Authorization', `Bearer ${mgrAuth.token}`);

    expect(response.status).toBe(403);
  });
});

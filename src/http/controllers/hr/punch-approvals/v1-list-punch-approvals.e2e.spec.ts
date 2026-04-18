import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('List Punch Approvals (E2E)', () => {
  let tenantId: string;
  let token: string;
  let employeeIdA: string;
  let employeeIdB: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;

    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;

    const empA = await createEmployeeE2E({ tenantId });
    employeeIdA = empA.employeeId;
    const empB = await createEmployeeE2E({ tenantId });
    employeeIdB = empB.employeeId;

    // Cria 3 approvals: 2 para empA (1 PENDING + 1 APPROVED), 1 para empB (PENDING)
    const teA = await prisma.timeEntry.create({
      data: {
        tenantId,
        employeeId: employeeIdA,
        entryType: 'CLOCK_IN',
        timestamp: new Date(Date.now() - 7200000),
      },
    });
    const teA2 = await prisma.timeEntry.create({
      data: {
        tenantId,
        employeeId: employeeIdA,
        entryType: 'CLOCK_OUT',
        timestamp: new Date(Date.now() - 3600000),
      },
    });
    const teB = await prisma.timeEntry.create({
      data: {
        tenantId,
        employeeId: employeeIdB,
        entryType: 'CLOCK_IN',
        timestamp: new Date(Date.now() - 1800000),
      },
    });

    await prisma.punchApproval.create({
      data: {
        tenantId,
        timeEntryId: teA.id,
        employeeId: employeeIdA,
        reason: 'OUT_OF_GEOFENCE',
        details: { distance: 350, zoneId: 'zone-1' },
        status: 'PENDING',
      },
    });
    await prisma.punchApproval.create({
      data: {
        tenantId,
        timeEntryId: teA2.id,
        employeeId: employeeIdA,
        reason: 'OUT_OF_GEOFENCE',
        details: { distance: 120 },
        status: 'APPROVED',
        resolverUserId: 'some-resolver',
        resolvedAt: new Date(),
      },
    });
    await prisma.punchApproval.create({
      data: {
        tenantId,
        timeEntryId: teB.id,
        employeeId: employeeIdB,
        reason: 'OUT_OF_GEOFENCE',
        details: { distance: 500 },
        status: 'PENDING',
      },
    });
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).get('/v1/hr/punch-approvals');
    expect(response.status).toBe(401);
  });

  it('should list all approvals (admin permission) with pagination shape', async () => {
    const response = await request(app.server)
      .get('/v1/hr/punch-approvals')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('items');
    expect(response.body).toHaveProperty('total');
    expect(response.body).toHaveProperty('page');
    expect(response.body).toHaveProperty('pageSize');
    expect(Array.isArray(response.body.items)).toBe(true);
    // Admin vê tudo do tenant — 3 aprovações criadas
    expect(response.body.total).toBeGreaterThanOrEqual(3);
  });

  it('should filter by status=PENDING (gestor no dashboard)', async () => {
    const response = await request(app.server)
      .get('/v1/hr/punch-approvals?status=PENDING')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    const statuses = response.body.items.map(
      (it: { status: string }) => it.status,
    );
    expect(statuses.every((s: string) => s === 'PENDING')).toBe(true);
  });

  it('should filter by employeeId', async () => {
    const response = await request(app.server)
      .get(`/v1/hr/punch-approvals?employeeId=${employeeIdA}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    const employeeIds = response.body.items.map(
      (it: { employeeId: string }) => it.employeeId,
    );
    expect(employeeIds.every((e: string) => e === employeeIdA)).toBe(true);
    expect(employeeIds.length).toBeGreaterThanOrEqual(2);
  });

  it('should return items with reason, details JSON and status shapes', async () => {
    const response = await request(app.server)
      .get('/v1/hr/punch-approvals?status=PENDING')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    const item = response.body.items[0];
    expect(item).toHaveProperty('id');
    expect(item).toHaveProperty('reason', 'OUT_OF_GEOFENCE');
    expect(item).toHaveProperty('details');
    expect(item).toHaveProperty('status', 'PENDING');
    expect(item).toHaveProperty('createdAt');
  });
});

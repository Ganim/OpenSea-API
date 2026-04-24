import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

/**
 * Phase 7 / Plan 07-05b — E2E test do GET /v1/hr/punch/dashboard/heatmap.
 *
 * Cenários:
 *   1. 401 sem token.
 *   2. 200 admin → vê todos employees do tenant (3 rows).
 *   3. 200 line-manager → vê apenas subordinatos diretos + indiretos (BFS).
 *   4. 403 user sem permissão.
 *   5. Response não vaza CPF (LGPD sentinel).
 */
describe('Get Punch Heatmap (E2E)', () => {
  let tenantId: string;
  let adminToken: string;
  let employeeIdA: string;
  let employeeIdB: string;
  let employeeIdC: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;

    const adminAuth = await createAndAuthenticateUser(app, { tenantId });
    adminToken = adminAuth.token;

    const empA = await createEmployeeE2E({ tenantId });
    employeeIdA = empA.employeeId;
    const empB = await createEmployeeE2E({ tenantId });
    employeeIdB = empB.employeeId;
    const empC = await createEmployeeE2E({ tenantId });
    employeeIdC = empC.employeeId;

    void employeeIdA;
    void employeeIdB;
    void employeeIdC;
  });

  it('returns 401 without token', async () => {
    const response = await request(app.server).get(
      '/v1/hr/punch/dashboard/heatmap?month=2026-04',
    );
    expect(response.status).toBe(401);
  });

  it('admin sees all employees in tenant (3+ rows)', async () => {
    const response = await request(app.server)
      .get('/v1/hr/punch/dashboard/heatmap?month=2026-04')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('rows');
    expect(response.body).toHaveProperty('columns');
    expect(response.body).toHaveProperty('cells');
    expect(Array.isArray(response.body.rows)).toBe(true);
    expect(Array.isArray(response.body.columns)).toBe(true);
    expect(response.body.rows.length).toBeGreaterThanOrEqual(3);
    // April has 30 days
    expect(response.body.columns).toHaveLength(30);
  });

  it('LGPD sentinel — heatmap response does not contain CPF', async () => {
    const response = await request(app.server)
      .get('/v1/hr/punch/dashboard/heatmap?month=2026-04')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    const bodyJson = JSON.stringify(response.body);
    expect(bodyJson).not.toContain('cpf');
    expect(bodyJson).not.toContain('CPF');
  });

  it('returns 400 when month format is invalid', async () => {
    const response = await request(app.server)
      .get('/v1/hr/punch/dashboard/heatmap?month=2026/04')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(400);
  });

  it('line-manager sees only managed employees + self via BFS recursive scope (D-07)', async () => {
    // Setup: create manager user + 2 levels of subordinates.
    // CEO (mgrEmployee) → DIRECT (subEmployee) → INDIRECT (subSubEmployee)
    const { tenantId: tid2 } = await createAndSetupTenant();

    // Create employee with userId mapping to allow login + Employee link.
    const mgrAuth = await createAndAuthenticateUser(app, {
      tenantId: tid2,
      permissions: ['hr.punch-approvals.access'],
    });

    const mgrEmp = await createEmployeeE2E({
      tenantId: tid2,
      userId: mgrAuth.user.user.id,
    });
    const subEmp = await createEmployeeE2E({ tenantId: tid2 });
    const subSubEmp = await createEmployeeE2E({ tenantId: tid2 });

    // Wire hierarchy: subEmp.supervisorId = mgrEmp; subSubEmp.supervisorId = subEmp
    await prisma.employee.update({
      where: { id: subEmp.employeeId },
      data: { supervisorId: mgrEmp.employeeId },
    });
    await prisma.employee.update({
      where: { id: subSubEmp.employeeId },
      data: { supervisorId: subEmp.employeeId },
    });

    // Create another sibling employee NOT under this manager.
    const unrelatedEmp = await createEmployeeE2E({ tenantId: tid2 });
    void unrelatedEmp;

    const response = await request(app.server)
      .get('/v1/hr/punch/dashboard/heatmap?month=2026-04')
      .set('Authorization', `Bearer ${mgrAuth.token}`);

    expect(response.status).toBe(200);
    const rowIds: string[] = response.body.rows.map(
      (r: { id: string }) => r.id,
    );

    // Manager sees self + direct sub + indirect sub (BFS recursive — D-07).
    expect(rowIds).toContain(mgrEmp.employeeId);
    expect(rowIds).toContain(subEmp.employeeId);
    expect(rowIds).toContain(subSubEmp.employeeId);
    // Manager does NOT see unrelated employees.
    expect(rowIds).not.toContain(unrelatedEmp.employeeId);
  });

  it('returns 403 when user has no punch-approvals permission', async () => {
    const { tenantId: tid3 } = await createAndSetupTenant();
    const noPermAuth = await createAndAuthenticateUser(app, {
      tenantId: tid3,
      permissions: [],
    });

    const response = await request(app.server)
      .get('/v1/hr/punch/dashboard/heatmap?month=2026-04')
      .set('Authorization', `Bearer ${noPermAuth.token}`);

    expect(response.status).toBe(403);
  });
});

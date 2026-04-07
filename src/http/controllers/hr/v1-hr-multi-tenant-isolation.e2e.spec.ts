import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createCompanyE2E } from '@/utils/tests/factories/hr/create-company.e2e';
import { createDepartmentE2E } from '@/utils/tests/factories/hr/create-department.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

const ALL_HR_PERMISSIONS = [
  'hr.companies.create',
  'hr.companies.read',
  'hr.companies.update',
  'hr.companies.delete',
  'hr.companies.list',
  'hr.companies.manage',
  'hr.employees.create',
  'hr.employees.read',
  'hr.employees.read.all',
  'hr.employees.read.team',
  'hr.employees.update',
  'hr.employees.update.all',
  'hr.employees.update.team',
  'hr.employees.delete',
  'hr.employees.list',
  'hr.employees.list.all',
  'hr.employees.list.team',
  'hr.employees.terminate',
  'hr.employees.manage',
  'hr.departments.create',
  'hr.departments.read',
  'hr.departments.update',
  'hr.departments.delete',
  'hr.departments.list',
  'hr.departments.manage',
];

describe('HR Multi-Tenant Isolation (E2E)', () => {
  // Tenant A
  let tenantAId: string;
  let tokenA: string;
  let employeeAId: string;
  let departmentAId: string;
  let companyAId: string;

  // Tenant B
  let tokenB: string;

  beforeAll(async () => {
    await app.ready();

    // ── Tenant A setup ──────────────────────────────────────────────────
    const { tenantId: tidA } = await createAndSetupTenant({
      name: 'HR Isolation Test - Tenant A',
    });
    tenantAId = tidA;

    const authA = await createAndAuthenticateUser(app, {
      tenantId: tenantAId,
      permissions: ALL_HR_PERMISSIONS,
    });
    tokenA = authA.token;

    // Create company for Tenant A
    const { companyId: cIdA } = await createCompanyE2E({ tenantId: tenantAId });
    companyAId = cIdA;

    // Create department for Tenant A
    const { departmentId: dIdA } = await createDepartmentE2E({
      tenantId: tenantAId,
      companyId: companyAId,
    });
    departmentAId = dIdA;

    // Create employee for Tenant A
    const { employeeId: eIdA } = await createEmployeeE2E({
      tenantId: tenantAId,
      departmentId: departmentAId,
    });
    employeeAId = eIdA;

    // ── Tenant B setup ──────────────────────────────────────────────────
    const { tenantId: tenantBId } = await createAndSetupTenant({
      name: 'HR Isolation Test - Tenant B',
    });

    const authB = await createAndAuthenticateUser(app, {
      tenantId: tenantBId,
      permissions: ALL_HR_PERMISSIONS,
    });
    tokenB = authB.token;
  }, 60000);

  // ── Employee isolation ──────────────────────────────────────────────────

  describe('Employees', () => {
    it('should NOT list employees from another tenant', async () => {
      const res = await request(app.server)
        .get('/v1/hr/employees')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);

      const employeeIds = (res.body.employees ?? []).map(
        (e: { id: string }) => e.id,
      );
      expect(employeeIds).not.toContain(employeeAId);
    });

    it('should return 404 when getting employee from another tenant by ID', async () => {
      const res = await request(app.server)
        .get(`/v1/hr/employees/${employeeAId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
    });

    it('should return 404 when updating employee from another tenant', async () => {
      const res = await request(app.server)
        .put(`/v1/hr/employees/${employeeAId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ fullName: 'Hacked by Tenant B' });

      expect(res.status).toBe(404);
    });

    it('should return 404 when deleting employee from another tenant', async () => {
      const res = await request(app.server)
        .delete(`/v1/hr/employees/${employeeAId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
    });
  });

  // ── Department isolation ────────────────────────────────────────────────

  describe('Departments', () => {
    it('should NOT list departments from another tenant', async () => {
      const res = await request(app.server)
        .get('/v1/hr/departments')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);

      const departmentIds = (res.body.departments ?? []).map(
        (d: { id: string }) => d.id,
      );
      expect(departmentIds).not.toContain(departmentAId);
    });

    it('should return 404 when getting department from another tenant by ID', async () => {
      const res = await request(app.server)
        .get(`/v1/hr/departments/${departmentAId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
    });

    it('should return 404 when updating department from another tenant', async () => {
      const res = await request(app.server)
        .put(`/v1/hr/departments/${departmentAId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ name: 'Hacked by Tenant B' });

      expect(res.status).toBe(404);
    });

    it('should return 404 when deleting department from another tenant', async () => {
      const res = await request(app.server)
        .delete(`/v1/hr/departments/${departmentAId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
    });
  });

  // ── Company isolation ───────────────────────────────────────────────────

  describe('Companies', () => {
    it('should NOT list companies from another tenant', async () => {
      const res = await request(app.server)
        .get('/v1/hr/companies')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);

      const companies = Array.isArray(res.body) ? res.body : [];
      const companyIds = companies.map((c: { id: string }) => c.id);
      expect(companyIds).not.toContain(companyAId);
    });

    it('should return 404 when getting company from another tenant by ID', async () => {
      const res = await request(app.server)
        .get(`/v1/hr/companies/${companyAId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
    });

    it('should return 404 when updating company from another tenant', async () => {
      const res = await request(app.server)
        .patch(`/v1/hr/companies/${companyAId}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ legalName: 'Hacked by Tenant B' });

      expect(res.status).toBe(404);
    });

    it('should return 404 when deleting company from another tenant', async () => {
      const res = await request(app.server)
        .delete(`/v1/hr/companies/${companyAId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
    });
  });

  // ── Verify Tenant A data is still intact ────────────────────────────────

  describe('Tenant A data integrity', () => {
    it('should still allow Tenant A to list their own employees', async () => {
      const res = await request(app.server)
        .get('/v1/hr/employees')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const employeeIds = (res.body.employees ?? []).map(
        (e: { id: string }) => e.id,
      );
      expect(employeeIds).toContain(employeeAId);
    });

    it('should still allow Tenant A to get their own employee by ID', async () => {
      const res = await request(app.server)
        .get(`/v1/hr/employees/${employeeAId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.employee.id).toBe(employeeAId);
    });

    it('should still allow Tenant A to list their own departments', async () => {
      const res = await request(app.server)
        .get('/v1/hr/departments')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const departmentIds = (res.body.departments ?? []).map(
        (d: { id: string }) => d.id,
      );
      expect(departmentIds).toContain(departmentAId);
    });

    it('should still allow Tenant A to get their own department by ID', async () => {
      const res = await request(app.server)
        .get(`/v1/hr/departments/${departmentAId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.department.id).toBe(departmentAId);
    });

    it('should still allow Tenant A to list their own companies', async () => {
      const res = await request(app.server)
        .get('/v1/hr/companies')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      const companies = Array.isArray(res.body) ? res.body : [];
      const companyIds = companies.map((c: { id: string }) => c.id);
      expect(companyIds).toContain(companyAId);
    });

    it('should still allow Tenant A to get their own company by ID', async () => {
      const res = await request(app.server)
        .get(`/v1/hr/companies/${companyAId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(res.body.id).toBe(companyAId);
    });
  });
});

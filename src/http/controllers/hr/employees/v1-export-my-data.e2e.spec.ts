import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Export My Data — LGPD SAR (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('retorna 404 quando o usuário autenticado não tem registro de colaborador', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/hr/my-data')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toContain('colaborador');
  });

  it('retorna dados pessoais do colaborador autenticado com schema correto', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });

    const { employee } = await createEmployeeE2E({
      tenantId,
      userId: user.user.id,
    });

    const response = await request(app.server)
      .get('/v1/hr/my-data')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      tenantId,
      employee: expect.objectContaining({ id: employee.id }),
      dependants: expect.any(Array),
      vacationPeriods: expect.any(Array),
      absences: expect.any(Array),
      payrollItems: expect.any(Array),
      medicalExams: expect.any(Array),
      warnings: expect.any(Array),
      bonuses: expect.any(Array),
      deductions: expect.any(Array),
      timeEntries: expect.any(Array),
      benefitEnrollments: expect.any(Array),
    });
    expect(response.body.generatedAt).toBeTruthy();
  });

  it('inclui PayrollItems do colaborador com payroll pai no shape correto', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });

    const { employee } = await createEmployeeE2E({
      tenantId,
      userId: user.user.id,
    });

    const payroll = await prisma.payroll.create({
      data: {
        tenantId,
        referenceMonth: 1,
        referenceYear: 2026,
        status: 'APPROVED',
        totalGross: 5000,
        totalDeductions: 500,
        totalNet: 4500,
      },
    });

    await prisma.payrollItem.create({
      data: {
        payrollId: payroll.id,
        employeeId: employee.id,
        type: 'BASE_SALARY',
        description: 'Salário base',
        amount: 5000,
        isDeduction: false,
      },
    });

    const response = await request(app.server)
      .get('/v1/hr/my-data')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.payrollItems).toHaveLength(1);
    expect(response.body.payrollItems[0]).toMatchObject({
      employeeId: employee.id,
      amount: '5000',
      payroll: {
        referenceMonth: 1,
        referenceYear: 2026,
        status: 'APPROVED',
      },
    });
  });

  it('não vaza dados de colaboradores de outros tenants', async () => {
    const { tenantId: otherTenantId } = await createAndSetupTenant();

    const { user: userA } = await createAndAuthenticateUser(app, { tenantId });
    const { token: tokenA } = await createAndAuthenticateUser(app, {
      tenantId,
    });

    await createEmployeeE2E({ tenantId, userId: userA.user.id });

    const payrollOther = await prisma.payroll.create({
      data: {
        tenantId: otherTenantId,
        referenceMonth: 2,
        referenceYear: 2026,
        status: 'APPROVED',
        totalGross: 9000,
        totalDeductions: 900,
        totalNet: 8100,
      },
    });

    const otherEmployee = await createEmployeeE2E({ tenantId: otherTenantId });
    await prisma.payrollItem.create({
      data: {
        payrollId: payrollOther.id,
        employeeId: otherEmployee.employeeId,
        type: 'BASE_SALARY',
        description: 'Salário base (outro tenant)',
        amount: 9000,
        isDeduction: false,
      },
    });

    const response = await request(app.server)
      .get('/v1/hr/my-data')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(response.status).toBe(200);
    expect(response.body.payrollItems).toHaveLength(0);
  });
});

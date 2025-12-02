import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';
import { createPayroll } from '@/utils/tests/factories/hr/create-payroll.e2e';

describe('Calculate Payroll (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up payrolls between tests
    await prisma.payroll.deleteMany();
    // Clean up related HR data between tests
    await prisma.payrollItem.deleteMany();
    await prisma.bonus.deleteMany();
    await prisma.deduction.deleteMany();
    await prisma.timeEntry.deleteMany();
    await prisma.absence.deleteMany();
    await prisma.overtime.deleteMany();
    await prisma.timeBank.deleteMany();
    await prisma.vacationPeriod.deleteMany();
    await prisma.employee.deleteMany();
  });

  it('should allow MANAGER to calculate a payroll', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    // Create employee first
    await createEmployeeE2E();

    const payroll = await createPayroll({
      referenceMonth: 11,
      referenceYear: 2024,
    });

    const response = await request(app.server)
      .post(`/v1/hr/payrolls/${payroll.id}/calculate`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('payroll');
    expect(response.body.payroll.status).toBe('CALCULATED');
  });

  it('should return 404 when payroll not found', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const response = await request(app.server)
      .post('/v1/hr/payrolls/00000000-0000-0000-0000-000000000000/calculate')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
  });

  it('should NOT allow USER to calculate a payroll', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');
    const payroll = await createPayroll({
      referenceMonth: 12,
      referenceYear: 2024,
    });

    const response = await request(app.server)
      .post(`/v1/hr/payrolls/${payroll.id}/calculate`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(403);
  });

  it('should return 401 when no token is provided', async () => {
    const payroll = await createPayroll({
      referenceMonth: 1,
      referenceYear: 2026,
    });

    const response = await request(app.server).post(
      `/v1/hr/payrolls/${payroll.id}/calculate`,
    );

    expect(response.statusCode).toBe(401);
  });

  it('should return 400 when payroll is not in DRAFT status', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const payroll = await createPayroll({
      referenceMonth: 2,
      referenceYear: 2026,
      status: 'CALCULATED',
    });

    const response = await request(app.server)
      .post(`/v1/hr/payrolls/${payroll.id}/calculate`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(400);
  });
});

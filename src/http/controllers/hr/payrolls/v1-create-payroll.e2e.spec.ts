import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { generatePayrollData } from '@/utils/tests/factories/hr/create-payroll.e2e';

describe('Create Payroll (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up payrolls between tests
    await prisma.payroll.deleteMany();
  });

  it('should allow MANAGER to create a new payroll', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const payrollData = generatePayrollData({
      referenceMonth: 1,
      referenceYear: 2025,
    });

    const response = await request(app.server)
      .post('/v1/hr/payrolls')
      .set('Authorization', `Bearer ${token}`)
      .send(payrollData);

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('payroll');
    expect(response.body.payroll).toMatchObject({
      referenceMonth: payrollData.referenceMonth,
      referenceYear: payrollData.referenceYear,
      status: 'DRAFT',
    });
  });

  it('should allow ADMIN to create a new payroll', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const payrollData = generatePayrollData({
      referenceMonth: 2,
      referenceYear: 2025,
    });

    const response = await request(app.server)
      .post('/v1/hr/payrolls')
      .set('Authorization', `Bearer ${token}`)
      .send(payrollData);

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('payroll');
  });

  it('should NOT allow user without permission to create a payroll', async () => {
    const { token } = await createAndAuthenticateUser(app, );
    const payrollData = generatePayrollData({
      referenceMonth: 3,
      referenceYear: 2025,
    });

    const response = await request(app.server)
      .post('/v1/hr/payrolls')
      .set('Authorization', `Bearer ${token}`)
      .send(payrollData);

    expect(response.statusCode).toBe(403);
  });

  it('should return 401 when no token is provided', async () => {
    const payrollData = generatePayrollData();

    const response = await request(app.server)
      .post('/v1/hr/payrolls')
      .send(payrollData);

    expect(response.statusCode).toBe(401);
  });

  it('should return 400 when payroll already exists for period', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const payrollData = generatePayrollData({
      referenceMonth: 4,
      referenceYear: 2025,
    });

    await request(app.server)
      .post('/v1/hr/payrolls')
      .set('Authorization', `Bearer ${token}`)
      .send(payrollData);

    const response = await request(app.server)
      .post('/v1/hr/payrolls')
      .set('Authorization', `Bearer ${token}`)
      .send(payrollData);

    expect(response.statusCode).toBe(400);
  });
});

import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { generatePayrollData } from '@/utils/tests/factories/hr/create-payroll.e2e';

describe('Create Payroll (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create payroll with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const currentYear = new Date().getFullYear();
    const month = (Date.now() % 12) + 1;
    const payrollData = generatePayrollData({
      referenceMonth: month,
      referenceYear: currentYear,
    });

    const response = await request(app.server)
      .post('/v1/hr/payrolls')
      .set('Authorization', `Bearer ${token}`)
      .send(payrollData);

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('payroll');
    expect(response.body.payroll.status).toBe('DRAFT');
  });
});

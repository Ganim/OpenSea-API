import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';
import { createPayroll } from '@/utils/tests/factories/hr/create-payroll.e2e';

describe('Cancel Payroll (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should cancel payroll with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const { employee } = await createEmployeeE2E();
    const timestamp = Date.now();
    const month = (timestamp % 12) + 1;
    const year = 2020 + (timestamp % 10);
    const payroll = await createPayroll(employee.tenantId, {
      referenceMonth: month,
      referenceYear: year,
    });

    const response = await request(app.server)
      .post(`/v1/hr/payrolls/${payroll.id}/cancel`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('payroll');
    expect(response.body.payroll.status).toBe('CANCELLED');
  });
});

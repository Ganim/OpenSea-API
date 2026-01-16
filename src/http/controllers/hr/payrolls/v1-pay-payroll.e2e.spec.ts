import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createApprovedPayroll } from '@/utils/tests/factories/hr/create-payroll.e2e';

describe('Pay Payroll (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should pay payroll with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const timestamp = Date.now();
    const month = (timestamp % 12) + 1;
    const year = 2020 + (timestamp % 10);
    const payroll = await createApprovedPayroll({
      referenceMonth: month,
      referenceYear: year,
    });

    const response = await request(app.server)
      .post(`/v1/hr/payrolls/${payroll.id}/pay`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('payroll');
    expect(response.body.payroll.status).toBe('PAID');
  });
});

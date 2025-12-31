import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createPayroll } from '@/utils/tests/factories/hr/create-payroll.e2e';

describe('Get Payroll (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow MANAGER to get a payroll by id', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const payroll = await createPayroll();

    const response = await request(app.server)
      .get(`/v1/hr/payrolls/${payroll.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('payroll');
    expect(response.body.payroll.id).toBe(payroll.id);
    expect(response.body.payroll.referenceMonth).toBeDefined();
    expect(response.body.payroll.referenceYear).toBeDefined();
  });

  it('should return 404 when payroll not found', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .get(`/v1/hr/payrolls/${nonExistentId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
  });

  it('should return 401 when no token is provided', async () => {
    const payroll = await createPayroll();

    const response = await request(app.server).get(
      `/v1/hr/payrolls/${payroll.id}`,
    );

    expect(response.statusCode).toBe(401);
  });
});

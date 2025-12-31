import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createPayroll } from '@/utils/tests/factories/hr/create-payroll.e2e';

describe('List Payrolls (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow MANAGER to list payrolls', async () => {
    const { token } = await createAndAuthenticateUser(app);

    await createPayroll({ referenceMonth: 7, referenceYear: 2025 });
    await createPayroll({ referenceMonth: 8, referenceYear: 2025 });

    const response = await request(app.server)
      .get('/v1/hr/payrolls')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('payrolls');
    expect(Array.isArray(response.body.payrolls)).toBe(true);
    expect(response.body.payrolls.length).toBeGreaterThanOrEqual(2);
  });

  it('should filter payrolls by year', async () => {
    const { token } = await createAndAuthenticateUser(app);

    await createPayroll({ referenceMonth: 9, referenceYear: 2024 });
    await createPayroll({ referenceMonth: 10, referenceYear: 2025 });

    const response = await request(app.server)
      .get('/v1/hr/payrolls')
      .query({ referenceYear: 2024 })
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    response.body.payrolls.forEach((payroll: { referenceYear: number }) => {
      expect(payroll.referenceYear).toBe(2024);
    });
  });

  it('should return 401 when no token is provided', async () => {
    const response = await request(app.server).get('/v1/hr/payrolls');

    expect(response.statusCode).toBe(401);
  });
});

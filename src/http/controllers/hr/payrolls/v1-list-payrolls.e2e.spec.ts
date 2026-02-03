import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';
import { createPayroll } from '@/utils/tests/factories/hr/create-payroll.e2e';

describe('List Payrolls (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list payrolls with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const { employee } = await createEmployeeE2E();

    await createPayroll(employee.tenantId);

    const response = await request(app.server)
      .get('/v1/hr/payrolls')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('payrolls');
    expect(Array.isArray(response.body.payrolls)).toBe(true);
  });
});

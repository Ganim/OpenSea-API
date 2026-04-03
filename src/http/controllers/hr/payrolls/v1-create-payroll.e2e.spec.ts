import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { generatePayrollData } from '@/utils/tests/factories/hr/create-payroll.e2e';

describe('Create Payroll (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should create payroll with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const testMonth = 1;
    const testYear = 2025;
    const payrollData = generatePayrollData({
      referenceMonth: testMonth,
      referenceYear: testYear,
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

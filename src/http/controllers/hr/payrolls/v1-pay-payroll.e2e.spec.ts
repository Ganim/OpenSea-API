import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createApprovedPayroll } from '@/utils/tests/factories/hr/create-payroll.e2e';

describe('Pay Payroll (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should pay payroll with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const testMonth = 3;
    const testYear = 2025;
    const payroll = await createApprovedPayroll(tenantId, {
      referenceMonth: testMonth,
      referenceYear: testYear,
    });

    const response = await request(app.server)
      .post(`/v1/hr/payrolls/${payroll.id}/pay`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('payroll');
    expect(response.body.payroll.status).toBe('PAID');
  });
});

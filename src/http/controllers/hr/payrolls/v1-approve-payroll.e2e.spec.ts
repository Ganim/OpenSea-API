import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createCalculatedPayroll } from '@/utils/tests/factories/hr/create-payroll.e2e';

describe('Approve Payroll (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should approve a calculated payroll with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const testMonth = 2;
    const testYear = 2025;
    const payroll = await createCalculatedPayroll(tenantId, {
      referenceMonth: testMonth,
      referenceYear: testYear,
    });

    const response = await request(app.server)
      .post(`/v1/hr/payrolls/${payroll.id}/approve`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('payroll');
    expect(response.body.payroll.status).toBe('APPROVED');
    expect(response.body.payroll.approvedAt).toBeDefined();
  });
});

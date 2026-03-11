import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createPayroll } from '@/utils/tests/factories/hr/create-payroll.e2e';

describe('Cancel Payroll (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should cancel payroll with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const testMonth = 4;
    const testYear = 2025;
    const payroll = await createPayroll(tenantId, {
      referenceMonth: testMonth,
      referenceYear: testYear,
    });

    const response = await request(app.server)
      .post(`/v1/hr/payrolls/${payroll.id}/cancel`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('payroll');
    expect(response.body.payroll.status).toBe('CANCELLED');
  });
});

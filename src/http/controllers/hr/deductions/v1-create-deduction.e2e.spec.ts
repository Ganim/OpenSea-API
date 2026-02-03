import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { generateDeductionData } from '@/utils/tests/factories/hr/create-deduction.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Create Deduction (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create deduction with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { employeeId } = await createEmployeeE2E({ tenantId });
    const deductionData = generateDeductionData(employeeId);

    const response = await request(app.server)
      .post('/v1/hr/deductions')
      .set('Authorization', `Bearer ${token}`)
      .send(deductionData);

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('deduction');
    expect(response.body.deduction.name).toBe(deductionData.name);
    expect(response.body.deduction.amount).toBe(deductionData.amount);
  });
});

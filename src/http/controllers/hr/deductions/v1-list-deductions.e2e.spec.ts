import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createDeduction } from '@/utils/tests/factories/hr/create-deduction.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('List Deductions (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list deductions with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { employeeId } = await createEmployeeE2E({ tenantId });

    await createDeduction(tenantId, employeeId, { name: 'Deduction 1' });

    const response = await request(app.server)
      .get('/v1/hr/deductions')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('deductions');
    expect(Array.isArray(response.body.deductions)).toBe(true);
  });
});

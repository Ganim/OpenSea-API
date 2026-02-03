import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Update Employee (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const tenant = await createAndSetupTenant();
    tenantId = tenant.tenantId;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should update employee with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { employee } = await createEmployeeE2E({ tenantId });

    const newName = `Updated Employee ${Date.now()}`;
    const response = await request(app.server)
      .put(`/v1/hr/employees/${employee.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        fullName: newName,
        baseSalary: 7500,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('employee');
    expect(response.body.employee.fullName).toBe(newName);
    expect(response.body.employee.baseSalary).toBe(7500);
  });
});

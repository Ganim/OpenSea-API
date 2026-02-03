import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createDepartmentE2E } from '@/utils/tests/factories/hr/create-department.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Transfer Employee (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const tenant = await createAndSetupTenant();
    tenantId = tenant.tenantId;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should transfer employee with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const { departmentId: oldDepartmentId, companyId } =
      await createDepartmentE2E({
        tenantId,
        name: `Old Department ${Date.now()}`,
        code: `OLD-${Date.now()}`,
      });

    const { departmentId: newDepartmentId } = await createDepartmentE2E({
      tenantId,
      name: `New Department ${Date.now()}`,
      code: `NEW-${Date.now()}`,
      companyId,
    });

    const { employee } = await createEmployeeE2E({
      tenantId,
      departmentId: oldDepartmentId,
    });

    const response = await request(app.server)
      .post(`/v1/hr/employees/${employee.id}/transfer`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        newDepartmentId,
        effectiveDate: new Date().toISOString(),
        reason: 'Promocao para novo departamento',
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('employee');
    expect(response.body.employee.departmentId).toBe(newDepartmentId);
  });
});

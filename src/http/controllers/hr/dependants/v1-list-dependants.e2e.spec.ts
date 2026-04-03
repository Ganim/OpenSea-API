import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createDependantE2E } from '@/utils/tests/factories/hr/create-dependant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('List Dependants (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should list dependants for an employee', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { employeeId } = await createEmployeeE2E({ tenantId });

    await createDependantE2E({
      tenantId,
      employeeId,
      name: 'Dependant 1',
      relationship: 'CHILD',
    });
    await createDependantE2E({
      tenantId,
      employeeId,
      name: 'Dependant 2',
      relationship: 'SPOUSE',
    });

    const response = await request(app.server)
      .get(`/v1/hr/employees/${employeeId}/dependants`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('dependants');
    expect(Array.isArray(response.body.dependants)).toBe(true);
    expect(response.body.dependants.length).toBeGreaterThanOrEqual(2);
  });
});

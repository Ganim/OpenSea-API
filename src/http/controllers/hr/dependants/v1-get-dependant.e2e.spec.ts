import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createDependantE2E } from '@/utils/tests/factories/hr/create-dependant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Get Dependant (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should get a specific dependant by id', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { employeeId } = await createEmployeeE2E({ tenantId });

    const { dependantId } = await createDependantE2E({
      tenantId,
      employeeId,
      name: 'João Silva',
      relationship: 'CHILD',
    });

    const response = await request(app.server)
      .get(`/v1/hr/employees/${employeeId}/dependants/${dependantId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('dependant');
    expect(response.body.dependant.id).toBe(dependantId);
    expect(response.body.dependant.name).toBe('João Silva');
  });

  it('should return 404 for non-existent dependant', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { employeeId } = await createEmployeeE2E({ tenantId });

    const response = await request(app.server)
      .get(
        `/v1/hr/employees/${employeeId}/dependants/00000000-0000-0000-0000-000000000000`,
      )
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
  });
});

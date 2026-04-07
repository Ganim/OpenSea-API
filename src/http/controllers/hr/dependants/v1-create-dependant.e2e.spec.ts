import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { generateDependantData } from '@/utils/tests/factories/hr/create-dependant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Create Dependant (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should create a dependant for an employee', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { employeeId } = await createEmployeeE2E({ tenantId });

    const dependantData = generateDependantData({
      name: 'Maria Silva',
      relationship: 'CHILD',
    });

    const response = await request(app.server)
      .post(`/v1/hr/employees/${employeeId}/dependants`)
      .set('Authorization', `Bearer ${token}`)
      .send(dependantData);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('dependant');
    expect(response.body.dependant).toHaveProperty('id');
    expect(response.body.dependant.name).toBe('Maria Silva');
    expect(response.body.dependant.relationship).toBe('CHILD');
  });

  it('should return 404 for non-existent employee', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const dependantData = generateDependantData();

    const response = await request(app.server)
      .post('/v1/hr/employees/00000000-0000-0000-0000-000000000000/dependants')
      .set('Authorization', `Bearer ${token}`)
      .send(dependantData);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
  });
});

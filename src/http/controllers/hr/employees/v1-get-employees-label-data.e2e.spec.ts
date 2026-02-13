import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Get Employees Label Data (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return label data for employees', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const { employee } = await createEmployeeE2E({ tenantId });

    const response = await request(app.server)
      .post('/v1/hr/employees/label-data')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeIds: [employee.id],
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('labelData');
    expect(Array.isArray(response.body.labelData)).toBe(true);
    expect(response.body.labelData.length).toBe(1);
    expect(response.body.labelData[0]).toHaveProperty('employee');
    expect(response.body.labelData[0]).toHaveProperty('tenant');
    expect(response.body.labelData[0].employee.id).toBe(employee.id);
  });

  it('should return empty array for non-existent employee ids', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/hr/employees/label-data')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeIds: ['00000000-0000-0000-0000-000000000000'],
      });

    expect(response.status).toBe(200);
    expect(response.body.labelData).toEqual([]);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server)
      .post('/v1/hr/employees/label-data')
      .send({
        employeeIds: ['00000000-0000-0000-0000-000000000000'],
      });

    expect([400, 401]).toContain(response.status);
  });
});

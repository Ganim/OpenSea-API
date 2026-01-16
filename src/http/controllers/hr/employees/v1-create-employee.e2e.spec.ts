import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { generateEmployeeData } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Create Employee (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create employee with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const employeeData = generateEmployeeData();

    const response = await request(app.server)
      .post('/v1/hr/employees')
      .set('Authorization', `Bearer ${token}`)
      .send(employeeData);

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('employee');
    expect(response.body.employee).toHaveProperty('id');
    expect(response.body.employee.fullName).toBe(employeeData.fullName);
    expect(response.body.employee.status).toBe('ACTIVE');
  });
});

import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Get Employee By Id (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get employee by id as MANAGER', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const { employeeId, employee } = await createEmployeeE2E();

    const response = await request(app.server)
      .get(`/v1/hr/employees/${employeeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('employee');
    expect(response.body.employee.id).toBe(employeeId);
    expect(response.body.employee.fullName).toBe(employee.fullName);
    expect(response.body.employee.cpf).toBeDefined();
    expect(response.body.employee.registrationNumber).toBe(
      employee.registrationNumber,
    );
  });

  it('should get employee by id as USER', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const { employeeId } = await createEmployeeE2E();

    const response = await request(app.server)
      .get(`/v1/hr/employees/${employeeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('employee');
    expect(response.body.employee.id).toBe(employeeId);
  });

  it('should return 404 when employee does not exist', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .get(`/v1/hr/employees/${nonExistentId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toContain('Employee');
  });

  it('should return 401 when no token is provided', async () => {
    const { employeeId } = await createEmployeeE2E();

    const response = await request(app.server).get(
      `/v1/hr/employees/${employeeId}`,
    );

    expect(response.statusCode).toBe(401);
  });

  it('should return complete employee data with all fields', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const { employeeId } = await createEmployeeE2E({
      fullName: 'Complete Employee Test',
      baseSalary: 5000,
      contractType: 'CLT',
      workRegime: 'FULL_TIME',
      weeklyHours: 44,
    });

    const response = await request(app.server)
      .get(`/v1/hr/employees/${employeeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.employee).toMatchObject({
      id: employeeId,
      fullName: 'Complete Employee Test',
      baseSalary: 5000,
      contractType: 'CLT',
      workRegime: 'FULL_TIME',
      weeklyHours: 44,
    });
  });
});

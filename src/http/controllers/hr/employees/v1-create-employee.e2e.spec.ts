import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import {
    generateEmployeeData,
    generateRegistrationNumber,
    generateValidCPF,
    generateValidPIS,
} from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Create Employee (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow MANAGER to create a new employee', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const employeeData = generateEmployeeData();

    const response = await request(app.server)
      .post('/v1/hr/employees')
      .set('Authorization', `Bearer ${token}`)
      .send(employeeData);

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('employee');
    expect(response.body.employee).toMatchObject({
      fullName: employeeData.fullName,
      cpf: expect.any(String),
      registrationNumber: employeeData.registrationNumber,
      status: 'ACTIVE',
      contractType: employeeData.contractType,
      workRegime: employeeData.workRegime,
    });
    expect(response.body.employee.id).toBeDefined();
  });

  it('should allow ADMIN to create a new employee', async () => {
    const { token } = await createAndAuthenticateUser(app, 'ADMIN');
    const employeeData = generateEmployeeData();

    const response = await request(app.server)
      .post('/v1/hr/employees')
      .set('Authorization', `Bearer ${token}`)
      .send(employeeData);

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('employee');
    expect(response.body.employee.fullName).toBe(employeeData.fullName);
  });

  it('should NOT allow USER to create an employee', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');
    const employeeData = generateEmployeeData();

    const response = await request(app.server)
      .post('/v1/hr/employees')
      .set('Authorization', `Bearer ${token}`)
      .send(employeeData);

    expect(response.statusCode).toBe(403);
  });

  it('should return 401 when no token is provided', async () => {
    const employeeData = generateEmployeeData();

    const response = await request(app.server)
      .post('/v1/hr/employees')
      .send(employeeData);

    expect(response.statusCode).toBe(401);
  });

  it('should return 400 when CPF is already registered', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const cpf = generateValidCPF();

    const firstEmployee = generateEmployeeData({ cpf });
    await request(app.server)
      .post('/v1/hr/employees')
      .set('Authorization', `Bearer ${token}`)
      .send(firstEmployee);

    const secondEmployee = generateEmployeeData({
      cpf,
      registrationNumber: generateRegistrationNumber(),
    });

    const response = await request(app.server)
      .post('/v1/hr/employees')
      .set('Authorization', `Bearer ${token}`)
      .send(secondEmployee);

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toContain('CPF already exists');
  });

  it('should return 400 when registration number is already used', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const registrationNumber = generateRegistrationNumber();

    const firstEmployee = generateEmployeeData({ registrationNumber });
    await request(app.server)
      .post('/v1/hr/employees')
      .set('Authorization', `Bearer ${token}`)
      .send(firstEmployee);

    const secondEmployee = generateEmployeeData({
      cpf: generateValidCPF(),
      registrationNumber,
    });

    const response = await request(app.server)
      .post('/v1/hr/employees')
      .set('Authorization', `Bearer ${token}`)
      .send(secondEmployee);

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toContain(
      'registration number already exists',
    );
  });

  it('should return 400 when required fields are missing', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const response = await request(app.server)
      .post('/v1/hr/employees')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fullName: 'Test Employee',
        // Missing required fields: cpf, hireDate, baseSalary, contractType, workRegime, country
      });

    expect(response.statusCode).toBe(400);
  });

  it('should create employee with optional PIS', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const validPis = generateValidPIS();
    const employeeData = {
      ...generateEmployeeData(),
      pis: validPis,
    };

    const response = await request(app.server)
      .post('/v1/hr/employees')
      .set('Authorization', `Bearer ${token}`)
      .send(employeeData);

    expect(response.statusCode).toBe(201);
    expect(response.body.employee.pis).toBeDefined();
  });
});

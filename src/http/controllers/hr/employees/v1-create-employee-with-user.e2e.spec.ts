import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import {
  generateEmployeeData,
  generateRegistrationNumber,
  generateValidCPF,
} from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Create Employee with User (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow user with permission to create a new employee with user account', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const employeeData = generateEmployeeData();

    const response = await request(app.server)
      .post('/v1/hr/employees-with-user')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...employeeData,
        userEmail: `test-${Date.now()}@example.com`,
        userPassword: 'securePassword123',
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('employee');
    expect(response.body).toHaveProperty('user');

    // Validate employee data
    expect(response.body.employee).toMatchObject({
      fullName: employeeData.fullName,
      cpf: expect.any(String),
      registrationNumber: employeeData.registrationNumber,
      status: 'ACTIVE',
      contractType: employeeData.contractType,
      workRegime: employeeData.workRegime,
    });
    expect(response.body.employee.id).toBeDefined();
    expect(response.body.employee.userId).toBeDefined();

    // Validate user data
    expect(response.body.user).toMatchObject({
      id: expect.any(String),
      email: expect.stringContaining('@example.com'),
    });
    expect(response.body.user.profile).toBeDefined();

    // Validate that employee is linked to user
    expect(response.body.employee.userId).toBe(response.body.user.id);
  });

  it('should create another employee with user account', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const employeeData = generateEmployeeData();

    const response = await request(app.server)
      .post('/v1/hr/employees-with-user')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...employeeData,
        userEmail: `admin-test-${Date.now()}@example.com`,
        userPassword: 'securePassword123',
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('employee');
    expect(response.body).toHaveProperty('user');
  });

  it('should NOT allow user without permission to create an employee with user account', async () => {
    const { token } = await createAndAuthenticateUser(app, );
    const employeeData = generateEmployeeData();

    const response = await request(app.server)
      .post('/v1/hr/employees-with-user')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...employeeData,
        userEmail: `user-test-${Date.now()}@example.com`,
        userPassword: 'securePassword123',
      });

    expect(response.statusCode).toBe(403);
  });

  it('should return 401 when no token is provided', async () => {
    const employeeData = generateEmployeeData();

    const response = await request(app.server)
      .post('/v1/hr/employees-with-user')
      .send({
        ...employeeData,
        userEmail: `unauth-test-${Date.now()}@example.com`,
        userPassword: 'securePassword123',
      });

    expect(response.statusCode).toBe(401);
  });

  it('should return 400 when CPF is already registered', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const cpf = generateValidCPF();

    // Create first employee
    const firstEmployee = generateEmployeeData({ cpf });
    await request(app.server)
      .post('/v1/hr/employees-with-user')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...firstEmployee,
        userEmail: `first-${Date.now()}@example.com`,
        userPassword: 'securePassword123',
      });

    // Try to create second employee with same CPF
    const secondEmployee = generateEmployeeData({
      cpf,
      registrationNumber: generateRegistrationNumber(),
    });

    const response = await request(app.server)
      .post('/v1/hr/employees-with-user')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...secondEmployee,
        userEmail: `second-${Date.now()}@example.com`,
        userPassword: 'securePassword123',
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toContain('CPF already exists');
  });

  it('should return 400 when user email is already in use', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const duplicateEmail = `duplicate-${Date.now()}@example.com`;

    // Create first employee with user
    const firstEmployee = generateEmployeeData();
    await request(app.server)
      .post('/v1/hr/employees-with-user')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...firstEmployee,
        userEmail: duplicateEmail,
        userPassword: 'securePassword123',
      });

    // Try to create second employee with same email
    const secondEmployee = generateEmployeeData({
      cpf: generateValidCPF(),
      registrationNumber: generateRegistrationNumber(),
    });

    const response = await request(app.server)
      .post('/v1/hr/employees-with-user')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...secondEmployee,
        userEmail: duplicateEmail,
        userPassword: 'securePassword123',
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toContain('email is already in use');
  });

  it('should return 400 when required user fields are missing', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const employeeData = generateEmployeeData();

    const response = await request(app.server)
      .post('/v1/hr/employees-with-user')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...employeeData,
        // Missing userEmail and userPassword
      });

    expect(response.statusCode).toBe(400);
  });

  it('should return 400 when password is too short', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const employeeData = generateEmployeeData();

    const response = await request(app.server)
      .post('/v1/hr/employees-with-user')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...employeeData,
        userEmail: `short-pass-${Date.now()}@example.com`,
        userPassword: 'short', // Less than 8 characters
      });

    expect(response.statusCode).toBe(400);
  });

  it('should create employee with custom username', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const employeeData = generateEmployeeData();
    const customUsername = `user${Date.now()}`;

    const response = await request(app.server)
      .post('/v1/hr/employees-with-user')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...employeeData,
        userEmail: `custom-${Date.now()}@example.com`,
        userPassword: 'securePassword123',
        username: customUsername,
      });

    if (response.statusCode !== 201) {
      console.error('Error response:', response.body);
    }

    expect(response.statusCode).toBe(201);
    expect(response.body.user.username).toBe(customUsername);
  });

  it('should auto-populate user profile from employee data', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const employeeData = {
      ...generateEmployeeData(),
      fullName: 'John Paul Doe',
      birthDate: new Date('1990-05-15'),
      photoUrl: 'https://example.com/photo.jpg',
    };

    const response = await request(app.server)
      .post('/v1/hr/employees-with-user')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...employeeData,
        userEmail: `profile-${Date.now()}@example.com`,
        userPassword: 'securePassword123',
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.user.profile.name).toBe('John');
    expect(response.body.user.profile.surname).toBe('Paul Doe');
    expect(response.body.user.profile.avatarUrl).toBe(
      'https://example.com/photo.jpg',
    );
  });
});

import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import {
  createEmployeeE2E,
  generateValidCPF,
} from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Update Employee (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should update employee as MANAGER', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const { employee } = await createEmployeeE2E();

    const newName = `Updated Employee ${Date.now()}`;
    const response = await request(app.server)
      .put(`/v1/hr/employees/${employee.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        fullName: newName,
        baseSalary: 7500,
        weeklyHours: 40,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('employee');
    expect(response.body.employee.fullName).toBe(newName);
    expect(response.body.employee.baseSalary).toBe(7500);
    expect(response.body.employee.weeklyHours).toBe(40);
  });

  it('should update employee as ADMIN', async () => {
    const { token } = await createAndAuthenticateUser(app, 'ADMIN');
    const { employee } = await createEmployeeE2E();

    const response = await request(app.server)
      .put(`/v1/hr/employees/${employee.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        fullName: 'Admin Updated Employee',
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.employee.fullName).toBe('Admin Updated Employee');
  });

  it('should NOT allow USER to update employee', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');
    const { employee } = await createEmployeeE2E();

    const response = await request(app.server)
      .put(`/v1/hr/employees/${employee.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        fullName: 'Should Not Update',
      });

    expect(response.statusCode).toBe(403);
  });

  it('should return 404 when employee does not exist', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .put(`/v1/hr/employees/${nonExistentId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        fullName: 'Non Existent',
      });

    expect(response.statusCode).toBe(404);
  });

  it('should return 401 when no token is provided', async () => {
    const { employee } = await createEmployeeE2E();

    const response = await request(app.server)
      .put(`/v1/hr/employees/${employee.id}`)
      .send({
        fullName: 'No Token Update',
      });

    expect(response.statusCode).toBe(401);
  });

  it('should update employee contact information', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const { employee } = await createEmployeeE2E();

    const response = await request(app.server)
      .put(`/v1/hr/employees/${employee.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 'new.email@test.com',
        phone: '11999998888',
        mobilePhone: '11987654321',
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.employee.email).toBe('new.email@test.com');
  });

  it('should update employee address information', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const { employee } = await createEmployeeE2E();

    const response = await request(app.server)
      .put(`/v1/hr/employees/${employee.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        address: 'Nova Rua Atualizada',
        addressNumber: '999',
        city: 'Nova Cidade',
        state: 'RJ',
        zipCode: '20000-000',
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.employee.address).toBe('Nova Rua Atualizada');
    expect(response.body.employee.city).toBe('Nova Cidade');
  });

  it('should update employee bank information', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const { employee } = await createEmployeeE2E();

    const response = await request(app.server)
      .put(`/v1/hr/employees/${employee.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        bankCode: '033',
        bankName: 'Santander',
        bankAgency: '1234',
        bankAccount: '567890',
        bankAccountType: 'Corrente',
        pixKey: 'newpix@email.com',
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.employee.bankName).toBe('Santander');
  });

  it('should return 400 when updating to an existing CPF', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const existingCpf = generateValidCPF();

    // Create first employee with specific CPF
    await createEmployeeE2E({ cpf: existingCpf });

    // Create second employee
    const { employee: secondEmployee } = await createEmployeeE2E();

    // Try to update second employee with first employee's CPF
    const response = await request(app.server)
      .put(`/v1/hr/employees/${secondEmployee.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        cpf: existingCpf,
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toContain('CPF already exists');
  });
});

import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import {
  generateEmployeeData,
  generateValidCPF,
} from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Check CPF (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return true when CPF exists', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const cpf = generateValidCPF();

    await request(app.server)
      .post('/v1/hr/employees')
      .set('Authorization', `Bearer ${token}`)
      .send(generateEmployeeData({ cpf }));

    const response = await request(app.server)
      .post('/v1/hr/employees/check-cpf')
      .set('Authorization', `Bearer ${token}`)
      .send({ cpf });

    expect(response.statusCode).toBe(200);
    expect(response.body.exists).toBe(true);
    expect(response.body.employeeId).toBeDefined();
    expect(response.body.isDeleted).toBe(false);
  });

  it('should return false when CPF does not exist', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .post('/v1/hr/employees/check-cpf')
      .set('Authorization', `Bearer ${token}`)
      .send({ cpf: generateValidCPF() });

    expect(response.statusCode).toBe(200);
    expect(response.body.exists).toBe(false);
    expect(response.body.employeeId).toBeNull();
  });

  it('should include soft-deleted employee when includeDeleted is true', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const cpf = generateValidCPF();

    const createResponse = await request(app.server)
      .post('/v1/hr/employees')
      .set('Authorization', `Bearer ${token}`)
      .send(generateEmployeeData({ cpf }));

    const employeeId = createResponse.body.employee.id as string;

    await request(app.server)
      .delete(`/v1/hr/employees/${employeeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    const withoutDeleted = await request(app.server)
      .post('/v1/hr/employees/check-cpf')
      .set('Authorization', `Bearer ${token}`)
      .send({ cpf });

    const withDeleted = await request(app.server)
      .post('/v1/hr/employees/check-cpf')
      .set('Authorization', `Bearer ${token}`)
      .send({ cpf, includeDeleted: true });

    expect(withoutDeleted.body.exists).toBe(false);
    expect(withDeleted.body.exists).toBe(true);
    expect(withDeleted.body.isDeleted).toBe(true);
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server)
      .post('/v1/hr/employees/check-cpf')
      .send({ cpf: generateValidCPF() });

    expect(response.statusCode).toBe(401);
  });

  it('should return 400 when CPF is invalid', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .post('/v1/hr/employees/check-cpf')
      .set('Authorization', `Bearer ${token}`)
      .send({ cpf: '123' });

    expect(response.statusCode).toBe(400);
  });
});

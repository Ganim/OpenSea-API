import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Delete Employee (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should soft delete employee as MANAGER', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const { employee, cpf } = await createEmployeeE2E();

    const response = await request(app.server)
      .delete(`/v1/hr/employees/${employee.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toBe(204);

    const checkCpf = await request(app.server)
      .post('/v1/hr/employees/check-cpf')
      .set('Authorization', `Bearer ${token}`)
      .send({ cpf });

    const checkCpfWithDeleted = await request(app.server)
      .post('/v1/hr/employees/check-cpf')
      .set('Authorization', `Bearer ${token}`)
      .send({ cpf, includeDeleted: true });

    expect(checkCpf.body.exists).toBe(false);
    expect(checkCpfWithDeleted.body.exists).toBe(true);
    expect(checkCpfWithDeleted.body.isDeleted).toBe(true);
  });

  it('should allow ADMIN to delete employee', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const { employee } = await createEmployeeE2E();

    const response = await request(app.server)
      .delete(`/v1/hr/employees/${employee.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toBe(204);
  });

  it('should NOT allow user without permission to delete employee', async () => {
    const { token } = await createAndAuthenticateUser(app, );
    const { employee } = await createEmployeeE2E();

    const response = await request(app.server)
      .delete(`/v1/hr/employees/${employee.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toBe(403);
  });

  it('should return 404 when employee does not exist', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .delete('/v1/hr/employees/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(response.statusCode).toBe(404);
  });

  it('should return 401 when not authenticated', async () => {
    const { employee } = await createEmployeeE2E();

    const response = await request(app.server)
      .delete(`/v1/hr/employees/${employee.id}`)
      .send();

    expect(response.statusCode).toBe(401);
  });
});

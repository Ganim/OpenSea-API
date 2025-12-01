import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Terminate Employee (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should terminate employee as MANAGER', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const { employee } = await createEmployeeE2E({ status: 'ACTIVE' });

    const terminationDate = new Date().toISOString();
    const response = await request(app.server)
      .post(`/v1/hr/employees/${employee.id}/terminate`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        terminationDate,
        reason: 'Pedido de demissão',
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('employee');
    expect(response.body.employee.status).toBe('TERMINATED');
    expect(response.body.employee.terminationDate).toBeDefined();
  });

  it('should terminate employee as ADMIN', async () => {
    const { token } = await createAndAuthenticateUser(app, 'ADMIN');
    const { employee } = await createEmployeeE2E({ status: 'ACTIVE' });

    const response = await request(app.server)
      .post(`/v1/hr/employees/${employee.id}/terminate`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        terminationDate: new Date().toISOString(),
        reason: 'Demissão sem justa causa',
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.employee.status).toBe('TERMINATED');
  });

  it('should NOT allow USER to terminate employee', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');
    const { employee } = await createEmployeeE2E({ status: 'ACTIVE' });

    const response = await request(app.server)
      .post(`/v1/hr/employees/${employee.id}/terminate`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        terminationDate: new Date().toISOString(),
        reason: 'Should not terminate',
      });

    expect(response.statusCode).toBe(403);
  });

  it('should return 404 when employee does not exist', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .post(`/v1/hr/employees/${nonExistentId}/terminate`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        terminationDate: new Date().toISOString(),
        reason: 'Non existent',
      });

    expect(response.statusCode).toBe(404);
  });

  it('should return 401 when no token is provided', async () => {
    const { employee } = await createEmployeeE2E({ status: 'ACTIVE' });

    const response = await request(app.server)
      .post(`/v1/hr/employees/${employee.id}/terminate`)
      .send({
        terminationDate: new Date().toISOString(),
        reason: 'No token',
      });

    expect(response.statusCode).toBe(401);
  });

  it('should return 400 when employee is already terminated', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const { employee } = await createEmployeeE2E({ status: 'TERMINATED' });

    const response = await request(app.server)
      .post(`/v1/hr/employees/${employee.id}/terminate`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        terminationDate: new Date().toISOString(),
        reason: 'Already terminated',
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toContain('already terminated');
  });

  it('should terminate employee without reason (optional field)', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const { employee } = await createEmployeeE2E({ status: 'ACTIVE' });

    const response = await request(app.server)
      .post(`/v1/hr/employees/${employee.id}/terminate`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        terminationDate: new Date().toISOString(),
        // reason is optional
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.employee.status).toBe('TERMINATED');
  });
});

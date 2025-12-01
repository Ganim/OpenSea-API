import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('List Employees (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list employees with pagination', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    // Create some employees
    await createEmployeeE2E();
    await createEmployeeE2E();
    await createEmployeeE2E();

    const response = await request(app.server)
      .get('/v1/hr/employees')
      .set('Authorization', `Bearer ${token}`)
      .query({ page: 1, perPage: 10 });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('employees');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.employees)).toBe(true);
    expect(response.body.meta.page).toBe(1);
    expect(response.body.employees.length).toBeGreaterThanOrEqual(3);
  });

  it('should allow USER to list employees', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');

    const response = await request(app.server)
      .get('/v1/hr/employees')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('employees');
  });

  it('should filter employees by status', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    await createEmployeeE2E({ status: 'ACTIVE' });
    await createEmployeeE2E({ status: 'ON_LEAVE' });

    const response = await request(app.server)
      .get('/v1/hr/employees')
      .set('Authorization', `Bearer ${token}`)
      .query({ status: 'ACTIVE' });

    expect(response.statusCode).toBe(200);
    expect(response.body.employees).toBeDefined();
    response.body.employees.forEach((employee: { status: string }) => {
      expect(employee.status).toBe('ACTIVE');
    });
  });

  it('should search employees by name', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const uniqueName = `UniqueTestEmployee${Date.now()}`;
    await createEmployeeE2E({ fullName: uniqueName });

    const response = await request(app.server)
      .get('/v1/hr/employees')
      .set('Authorization', `Bearer ${token}`)
      .query({ search: uniqueName });

    expect(response.statusCode).toBe(200);
    expect(response.body.employees.length).toBeGreaterThanOrEqual(1);
    expect(
      response.body.employees.some(
        (e: { fullName: string }) => e.fullName === uniqueName,
      ),
    ).toBe(true);
  });

  it('should return 401 when no token is provided', async () => {
    const response = await request(app.server).get('/v1/hr/employees');

    expect(response.statusCode).toBe(401);
  });

  it('should respect pagination perPage', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    // Create enough employees to test pagination
    for (let i = 0; i < 5; i++) {
      await createEmployeeE2E();
    }

    const response = await request(app.server)
      .get('/v1/hr/employees')
      .set('Authorization', `Bearer ${token}`)
      .query({ page: 1, perPage: 2 });

    expect(response.statusCode).toBe(200);
    expect(response.body.employees.length).toBeLessThanOrEqual(2);
    expect(response.body.meta.perPage).toBe(2);
  });
});

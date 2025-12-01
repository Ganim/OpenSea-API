import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createDepartmentE2E } from '@/utils/tests/factories/hr/create-department.e2e';

describe('List Departments (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow MANAGER to list departments', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    await createDepartmentE2E();
    await createDepartmentE2E();

    const response = await request(app.server)
      .get('/v1/hr/departments')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('departments');
    expect(response.body).toHaveProperty('meta');
    expect(response.body.meta).toHaveProperty('total');
    expect(response.body.meta).toHaveProperty('page');
    expect(response.body.meta).toHaveProperty('perPage');
    expect(response.body.meta).toHaveProperty('totalPages');
    expect(Array.isArray(response.body.departments)).toBe(true);
  });

  it('should allow ADMIN to list departments', async () => {
    const { token } = await createAndAuthenticateUser(app, 'ADMIN');

    const response = await request(app.server)
      .get('/v1/hr/departments')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('departments');
  });

  it('should allow USER to list departments', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');

    const response = await request(app.server)
      .get('/v1/hr/departments')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('departments');
  });

  it('should return 401 when no token is provided', async () => {
    const response = await request(app.server).get('/v1/hr/departments');

    expect(response.statusCode).toBe(401);
  });

  it('should paginate results', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    // Create multiple departments
    await createDepartmentE2E();
    await createDepartmentE2E();
    await createDepartmentE2E();

    const response = await request(app.server)
      .get('/v1/hr/departments')
      .query({ page: 1, perPage: 2 })
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.departments.length).toBeLessThanOrEqual(2);
    expect(response.body.meta.perPage).toBe(2);
  });

  it('should filter by search query', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    await createDepartmentE2E({ name: 'Engineering Department' });
    await createDepartmentE2E({ name: 'Marketing Department' });

    const response = await request(app.server)
      .get('/v1/hr/departments')
      .query({ search: 'Engineering' })
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(
      response.body.departments.some((d: { name: string }) =>
        d.name.includes('Engineering'),
      ),
    ).toBe(true);
  });

  it('should filter by isActive status', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const activeDept = await createDepartmentE2E({
      isActive: true,
      name: 'Active Department Test Unique' + Math.random(),
    });

    const responseActive = await request(app.server)
      .get('/v1/hr/departments')
      .query({ isActive: true })
      .set('Authorization', `Bearer ${token}`);

    expect(responseActive.statusCode).toBe(200);
    // Verifica se o departamento ativo criado existe na resposta
    expect(
      responseActive.body.departments.some(
        (d: { id: string }) => d.id === activeDept.departmentId,
      ),
    ).toBe(true);
    // Verifica que todos os departamentos retornados são ativos
    expect(
      responseActive.body.departments.every(
        (d: { isActive: boolean }) => d.isActive === true,
      ),
    ).toBe(true);
  });

  it('should return correct pagination metadata', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const response = await request(app.server)
      .get('/v1/hr/departments')
      .query({ page: 1, perPage: 10 })
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.meta.page).toBe(1);
    expect(response.body.meta.perPage).toBe(10);
    expect(typeof response.body.meta.total).toBe('number');
    expect(typeof response.body.meta.totalPages).toBe('number');
  });
});

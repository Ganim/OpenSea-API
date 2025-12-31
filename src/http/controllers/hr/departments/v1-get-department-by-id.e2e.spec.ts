import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createDepartmentE2E } from '@/utils/tests/factories/hr/create-department.e2e';

describe('Get Department By ID (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow MANAGER to get department by ID', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const { department, departmentId } = await createDepartmentE2E();

    const response = await request(app.server)
      .get(`/v1/hr/departments/${departmentId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('department');
    expect(response.body.department.id).toBe(departmentId);
    expect(response.body.department.name).toBe(department.name);
    expect(response.body.department.code).toBe(department.code);
  });

  it('should allow ADMIN to get department by ID', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const { departmentId } = await createDepartmentE2E();

    const response = await request(app.server)
      .get(`/v1/hr/departments/${departmentId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('department');
  });

  it('should allow USER to get department by ID', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const { departmentId } = await createDepartmentE2E();

    const response = await request(app.server)
      .get(`/v1/hr/departments/${departmentId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('department');
  });

  it('should return 401 when no token is provided', async () => {
    const { departmentId } = await createDepartmentE2E();

    const response = await request(app.server).get(
      `/v1/hr/departments/${departmentId}`,
    );

    expect(response.statusCode).toBe(401);
  });

  it('should return 404 when department is not found', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .get(`/v1/hr/departments/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
  });

  it('should return 400 when ID is invalid', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const invalidId = 'invalid-uuid';

    const response = await request(app.server)
      .get(`/v1/hr/departments/${invalidId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(400);
  });

  it('should return department with all fields', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const { departmentId } = await createDepartmentE2E({
      description: 'Test description',
    });

    const response = await request(app.server)
      .get(`/v1/hr/departments/${departmentId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.department).toHaveProperty('id');
    expect(response.body.department).toHaveProperty('name');
    expect(response.body.department).toHaveProperty('code');
    expect(response.body.department).toHaveProperty('description');
    expect(response.body.department).toHaveProperty('isActive');
    expect(response.body.department).toHaveProperty('createdAt');
    expect(response.body.department).toHaveProperty('updatedAt');
  });
});

import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import {
  generateDepartmentCode,
  generateDepartmentData,
} from '@/utils/tests/factories/hr/create-department.e2e';

describe('Create Department (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow MANAGER to create a new department', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const departmentData = generateDepartmentData();

    const response = await request(app.server)
      .post('/v1/hr/departments')
      .set('Authorization', `Bearer ${token}`)
      .send(departmentData);

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('department');
    expect(response.body.department).toMatchObject({
      name: departmentData.name,
      code: departmentData.code,
      isActive: departmentData.isActive,
    });
    expect(response.body.department.id).toBeDefined();
  });

  it('should allow ADMIN to create a new department', async () => {
    const { token } = await createAndAuthenticateUser(app, 'ADMIN');
    const departmentData = generateDepartmentData();

    const response = await request(app.server)
      .post('/v1/hr/departments')
      .set('Authorization', `Bearer ${token}`)
      .send(departmentData);

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('department');
    expect(response.body.department.name).toBe(departmentData.name);
  });

  it('should NOT allow USER to create a department', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');
    const departmentData = generateDepartmentData();

    const response = await request(app.server)
      .post('/v1/hr/departments')
      .set('Authorization', `Bearer ${token}`)
      .send(departmentData);

    expect(response.statusCode).toBe(403);
  });

  it('should return 401 when no token is provided', async () => {
    const departmentData = generateDepartmentData();

    const response = await request(app.server)
      .post('/v1/hr/departments')
      .send(departmentData);

    expect(response.statusCode).toBe(401);
  });

  it('should return 400 when code is already registered', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const code = generateDepartmentCode();

    const firstDepartment = generateDepartmentData({ code });
    await request(app.server)
      .post('/v1/hr/departments')
      .set('Authorization', `Bearer ${token}`)
      .send(firstDepartment);

    const secondDepartment = generateDepartmentData({ code });

    const response = await request(app.server)
      .post('/v1/hr/departments')
      .set('Authorization', `Bearer ${token}`)
      .send(secondDepartment);

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toContain('code already exists');
  });

  it('should return 400 when required fields are missing', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const response = await request(app.server)
      .post('/v1/hr/departments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        // Missing required fields: name, code
      });

    expect(response.statusCode).toBe(400);
  });

  it('should create department with optional description', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const departmentData = generateDepartmentData({
      description: 'Test department description',
    });

    const response = await request(app.server)
      .post('/v1/hr/departments')
      .set('Authorization', `Bearer ${token}`)
      .send(departmentData);

    expect(response.statusCode).toBe(201);
    expect(response.body.department.description).toBe(
      departmentData.description,
    );
  });

  it('should create inactive department', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const departmentData = generateDepartmentData({ isActive: false });

    const response = await request(app.server)
      .post('/v1/hr/departments')
      .set('Authorization', `Bearer ${token}`)
      .send(departmentData);

    expect(response.statusCode).toBe(201);
    expect(response.body.department.isActive).toBe(false);
  });
});

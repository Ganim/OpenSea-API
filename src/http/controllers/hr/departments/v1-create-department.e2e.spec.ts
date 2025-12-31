import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createCompanyE2E } from '@/utils/tests/factories/hr/create-company.e2e';
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
    const { token } = await createAndAuthenticateUser(app);
    const { companyId } = await createCompanyE2E();
    const departmentData = generateDepartmentData({ companyId });

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
      companyId,
    });
    expect(response.body.department.id).toBeDefined();
  });

  it('should allow ADMIN to create a new department', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const { companyId } = await createCompanyE2E();
    const departmentData = generateDepartmentData({ companyId });

    const response = await request(app.server)
      .post('/v1/hr/departments')
      .set('Authorization', `Bearer ${token}`)
      .send(departmentData);

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('department');
    expect(response.body.department.name).toBe(departmentData.name);
  });

  it('should NOT allow user without permission to create a department', async () => {
    const { token } = await createAndAuthenticateUser(app, );
    const { companyId } = await createCompanyE2E();
    const departmentData = generateDepartmentData({ companyId });

    const response = await request(app.server)
      .post('/v1/hr/departments')
      .set('Authorization', `Bearer ${token}`)
      .send(departmentData);

    expect(response.statusCode).toBe(403);
  });

  it('should return 401 when no token is provided', async () => {
    const { companyId } = await createCompanyE2E();
    const departmentData = generateDepartmentData({ companyId });

    const response = await request(app.server)
      .post('/v1/hr/departments')
      .send(departmentData);

    expect(response.statusCode).toBe(401);
  });

  it('should return 400 when code is already registered in the same company', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const { companyId } = await createCompanyE2E();
    const code = generateDepartmentCode();

    const firstDepartment = generateDepartmentData({ code, companyId });
    await request(app.server)
      .post('/v1/hr/departments')
      .set('Authorization', `Bearer ${token}`)
      .send(firstDepartment);

    const secondDepartment = generateDepartmentData({ code, companyId });

    const response = await request(app.server)
      .post('/v1/hr/departments')
      .set('Authorization', `Bearer ${token}`)
      .send(secondDepartment);

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toContain('code already exists');
  });

  it('should allow same code in different companies', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const { companyId: company1Id } = await createCompanyE2E();
    const { companyId: company2Id } = await createCompanyE2E();
    const code = generateDepartmentCode();

    const firstDepartment = generateDepartmentData({
      code,
      companyId: company1Id,
    });
    const response1 = await request(app.server)
      .post('/v1/hr/departments')
      .set('Authorization', `Bearer ${token}`)
      .send(firstDepartment);

    expect(response1.statusCode).toBe(201);

    const secondDepartment = generateDepartmentData({
      code,
      companyId: company2Id,
    });
    const response2 = await request(app.server)
      .post('/v1/hr/departments')
      .set('Authorization', `Bearer ${token}`)
      .send(secondDepartment);

    expect(response2.statusCode).toBe(201);
    expect(response2.body.department.code).toBe(code);
  });

  it('should return 400 when required fields are missing', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .post('/v1/hr/departments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        // Missing required fields: name, code, companyId
      });

    expect(response.statusCode).toBe(400);
  });

  it('should create department with optional description', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const { companyId } = await createCompanyE2E();
    const departmentData = generateDepartmentData({
      companyId,
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
    const { token } = await createAndAuthenticateUser(app);
    const { companyId } = await createCompanyE2E();
    const departmentData = generateDepartmentData({
      companyId,
      isActive: false,
    });

    const response = await request(app.server)
      .post('/v1/hr/departments')
      .set('Authorization', `Bearer ${token}`)
      .send(departmentData);

    expect(response.statusCode).toBe(201);
    expect(response.body.department.isActive).toBe(false);
  });
});

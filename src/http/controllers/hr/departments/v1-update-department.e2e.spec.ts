import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import {
  createDepartmentE2E,
  generateDepartmentCode,
} from '@/utils/tests/factories/hr/create-department.e2e';

describe('Update Department (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow MANAGER to update a department', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const { departmentId } = await createDepartmentE2E();
    const updateData = { name: 'Updated Department Name' };

    const response = await request(app.server)
      .put(`/v1/hr/departments/${departmentId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('department');
    expect(response.body.department.name).toBe(updateData.name);
  });

  it('should allow ADMIN to update a department', async () => {
    const { token } = await createAndAuthenticateUser(app, 'ADMIN');
    const { departmentId } = await createDepartmentE2E();
    const updateData = { description: 'Updated description' };

    const response = await request(app.server)
      .put(`/v1/hr/departments/${departmentId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData);

    expect(response.statusCode).toBe(200);
    expect(response.body.department.description).toBe(updateData.description);
  });

  it('should NOT allow USER to update a department', async () => {
    const { token } = await createAndAuthenticateUser(app, 'USER');
    const { departmentId } = await createDepartmentE2E();
    const updateData = { name: 'Should Not Work' };

    const response = await request(app.server)
      .put(`/v1/hr/departments/${departmentId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData);

    expect(response.statusCode).toBe(403);
  });

  it('should return 401 when no token is provided', async () => {
    const { departmentId } = await createDepartmentE2E();
    const updateData = { name: 'No Auth' };

    const response = await request(app.server)
      .put(`/v1/hr/departments/${departmentId}`)
      .send(updateData);

    expect(response.statusCode).toBe(401);
  });

  it('should return 404 when department is not found', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const updateData = { name: 'Not Found' };

    const response = await request(app.server)
      .put(`/v1/hr/departments/${fakeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData);

    expect(response.statusCode).toBe(404);
  });

  it('should return 400 when updating to existing code', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const { code: existingCode } = await createDepartmentE2E();
    const { departmentId } = await createDepartmentE2E();

    const response = await request(app.server)
      .put(`/v1/hr/departments/${departmentId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ code: existingCode });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toContain('code already exists');
  });

  it('should update department isActive status', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const { departmentId } = await createDepartmentE2E({ isActive: true });

    const response = await request(app.server)
      .put(`/v1/hr/departments/${departmentId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ isActive: false });

    expect(response.statusCode).toBe(200);
    expect(response.body.department.isActive).toBe(false);
  });

  it('should update department code successfully', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    const { departmentId } = await createDepartmentE2E();
    const newCode = generateDepartmentCode();

    const response = await request(app.server)
      .put(`/v1/hr/departments/${departmentId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ code: newCode });

    expect(response.statusCode).toBe(200);
    expect(response.body.department.code).toBe(newCode);
  });
});

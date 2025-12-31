import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createDepartmentE2E } from '@/utils/tests/factories/hr/create-department.e2e';

describe('Delete Department (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow MANAGER to delete a department', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const { departmentId } = await createDepartmentE2E();

    const response = await request(app.server)
      .delete(`/v1/hr/departments/${departmentId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(204);
  });

  it('should allow ADMIN to delete a department', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const { departmentId } = await createDepartmentE2E();

    const response = await request(app.server)
      .delete(`/v1/hr/departments/${departmentId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(204);
  });

  it('should NOT allow user without permission to delete a department', async () => {
    const { token } = await createAndAuthenticateUser(app, );
    const { departmentId } = await createDepartmentE2E();

    const response = await request(app.server)
      .delete(`/v1/hr/departments/${departmentId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(403);
  });

  it('should return 401 when no token is provided', async () => {
    const { departmentId } = await createDepartmentE2E();

    const response = await request(app.server).delete(
      `/v1/hr/departments/${departmentId}`,
    );

    expect(response.statusCode).toBe(401);
  });

  it('should return 404 when department is not found', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .delete(`/v1/hr/departments/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
  });

  it('should return 400 when ID is invalid', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const invalidId = 'invalid-uuid';

    const response = await request(app.server)
      .delete(`/v1/hr/departments/${invalidId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(400);
  });

  it('should not find department after deletion', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const { departmentId } = await createDepartmentE2E();

    // Delete
    await request(app.server)
      .delete(`/v1/hr/departments/${departmentId}`)
      .set('Authorization', `Bearer ${token}`);

    // Try to get
    const response = await request(app.server)
      .get(`/v1/hr/departments/${departmentId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
  });
});

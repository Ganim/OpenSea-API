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

  it('should get department by id with correct schema', async () => {
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
});

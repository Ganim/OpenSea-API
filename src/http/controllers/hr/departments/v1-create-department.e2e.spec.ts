import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createCompanyE2E } from '@/utils/tests/factories/hr/create-company.e2e';
import { generateDepartmentData } from '@/utils/tests/factories/hr/create-department.e2e';

describe('Create Department (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create department with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const { companyId } = await createCompanyE2E();
    const departmentData = generateDepartmentData({ companyId });

    const response = await request(app.server)
      .post('/v1/hr/departments')
      .set('Authorization', `Bearer ${token}`)
      .send(departmentData);

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('department');
    expect(response.body.department).toHaveProperty('id');
    expect(response.body.department.name).toBe(departmentData.name);
    expect(response.body.department.code).toBe(departmentData.code);
    expect(response.body.department.companyId).toBe(companyId);
  });
});

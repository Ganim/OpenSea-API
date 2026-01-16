import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { generateEmployeeData } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Create Employee with User (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create employee with user with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const employeeData = generateEmployeeData();

    const response = await request(app.server)
      .post('/v1/hr/employees-with-user')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...employeeData,
        userEmail: `test-${Date.now()}@example.com`,
        userPassword: 'securePassword123',
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('employee');
    expect(response.body).toHaveProperty('user');
    expect(response.body.employee.userId).toBe(response.body.user.id);
  });
});

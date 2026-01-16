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

  it('should list employees with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    await createEmployeeE2E();

    const response = await request(app.server)
      .get('/v1/hr/employees')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('employees');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.employees)).toBe(true);
  });
});

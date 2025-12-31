import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createDeduction } from '@/utils/tests/factories/hr/create-deduction.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Get Deduction (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow MANAGER to get a deduction by id', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const { employeeId } = await createEmployeeE2E();
    const deduction = await createDeduction(employeeId, {
      name: 'Test Deduction',
    });

    const response = await request(app.server)
      .get(`/v1/hr/deductions/${deduction.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('deduction');
    expect(response.body.deduction.id).toBe(deduction.id);
    expect(response.body.deduction.name).toBe('Test Deduction');
  });

  it('should return 404 when deduction not found', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .get('/v1/hr/deductions/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
  });

  it('should return 401 when no token is provided', async () => {
    const { employeeId } = await createEmployeeE2E();
    const deduction = await createDeduction(employeeId);

    const response = await request(app.server).get(
      `/v1/hr/deductions/${deduction.id}`,
    );

    expect(response.statusCode).toBe(401);
  });
});

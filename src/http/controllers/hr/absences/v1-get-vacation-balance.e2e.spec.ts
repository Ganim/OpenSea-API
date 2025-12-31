import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';
import {
  createAvailableVacationPeriodE2E,
  createCompletedVacationPeriodE2E,
} from '@/utils/tests/factories/hr/create-vacation-period.e2e';

describe('Get Vacation Balance (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get vacation balance for employee', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const { employeeId } = await createEmployeeE2E({ fullName: 'João Silva' });

    // Create some vacation periods
    await createAvailableVacationPeriodE2E({
      employeeId,
      totalDays: 30,
      usedDays: 10,
      soldDays: 0,
      remainingDays: 20,
    });
    await createCompletedVacationPeriodE2E({
      employeeId,
      totalDays: 30,
      usedDays: 30,
      remainingDays: 0,
    });

    const response = await request(app.server)
      .get(`/v1/hr/employees/${employeeId}/vacation-balance`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.employeeId).toBe(employeeId);
    expect(response.body.employeeName).toBe('João Silva');
    expect(response.body.totalAvailableDays).toBeDefined();
    expect(response.body.periods).toBeDefined();
    expect(Array.isArray(response.body.periods)).toBe(true);
  });

  it('should return 404 for non-existent employee', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .get(
        '/v1/hr/employees/00000000-0000-0000-0000-000000000000/vacation-balance',
      )
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBeDefined();
  });

  it('should return 401 when no token is provided', async () => {
    const response = await request(app.server).get(
      '/v1/hr/employees/00000000-0000-0000-0000-000000000000/vacation-balance',
    );

    expect(response.statusCode).toBe(401);
  });
});

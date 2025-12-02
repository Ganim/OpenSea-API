import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';
import { createVacationPeriodE2E } from '@/utils/tests/factories/hr/create-vacation-period.e2e';

describe('List Vacation Periods (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list vacation periods with pagination', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const { employeeId } = await createEmployeeE2E();

    // Create some vacation periods
    await createVacationPeriodE2E({ employeeId, status: 'PENDING' });
    await createVacationPeriodE2E({ employeeId, status: 'AVAILABLE' });
    await createVacationPeriodE2E({ employeeId, status: 'COMPLETED' });

    const response = await request(app.server)
      .get('/v1/hr/vacation-periods')
      .set('Authorization', `Bearer ${token}`)
      .query({ page: 1, perPage: 10 });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('vacationPeriods');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.vacationPeriods)).toBe(true);
    expect(response.body.meta.page).toBe(1);
  });

  it('should filter vacation periods by employee', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const { employeeId } = await createEmployeeE2E();

    await createVacationPeriodE2E({ employeeId });
    await createVacationPeriodE2E({ employeeId });

    const response = await request(app.server)
      .get('/v1/hr/vacation-periods')
      .set('Authorization', `Bearer ${token}`)
      .query({ employeeId });

    expect(response.statusCode).toBe(200);
    response.body.vacationPeriods.forEach((period: { employeeId: string }) => {
      expect(period.employeeId).toBe(employeeId);
    });
  });

  it('should filter vacation periods by status', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const { employeeId } = await createEmployeeE2E();

    await createVacationPeriodE2E({ employeeId, status: 'AVAILABLE' });
    await createVacationPeriodE2E({ employeeId, status: 'PENDING' });

    const response = await request(app.server)
      .get('/v1/hr/vacation-periods')
      .set('Authorization', `Bearer ${token}`)
      .query({ status: 'AVAILABLE' });

    expect(response.statusCode).toBe(200);
    response.body.vacationPeriods.forEach((period: { status: string }) => {
      expect(period.status).toBe('AVAILABLE');
    });
  });

  it('should return 401 when no token is provided', async () => {
    const response = await request(app.server).get('/v1/hr/vacation-periods');

    expect(response.statusCode).toBe(401);
  });
});

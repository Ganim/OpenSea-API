import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';
import {
  createAvailableVacationPeriodE2E,
  createVacationPeriodE2E,
} from '@/utils/tests/factories/hr/create-vacation-period.e2e';

describe('Schedule Vacation (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should schedule vacation for available period', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const { employeeId } = await createEmployeeE2E();
    const { vacationPeriodId } = await createAvailableVacationPeriodE2E({
      employeeId,
      remainingDays: 30,
    });

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 45);
    const endDate = new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000); // 15 dias

    const response = await request(app.server)
      .patch(`/v1/hr/vacation-periods/${vacationPeriodId}/schedule`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        days: 15,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.vacationPeriod).toBeDefined();
    expect(response.body.vacationPeriod.status).toBe('SCHEDULED');
    expect(response.body.vacationPeriod.scheduledStart).toBeDefined();
    expect(response.body.vacationPeriod.scheduledEnd).toBeDefined();
  });

  it('should not schedule vacation for less than 5 days', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const { employeeId } = await createEmployeeE2E();
    const { vacationPeriodId } = await createAvailableVacationPeriodE2E({
      employeeId,
      remainingDays: 30,
    });

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 45);
    const endDate = new Date(startDate.getTime() + 2 * 24 * 60 * 60 * 1000); // 3 dias

    const response = await request(app.server)
      .patch(`/v1/hr/vacation-periods/${vacationPeriodId}/schedule`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        days: 3,
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBeDefined();
  });

  it('should not schedule vacation for pending period', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const { employeeId } = await createEmployeeE2E();
    const { vacationPeriodId } = await createVacationPeriodE2E({
      employeeId,
      status: 'PENDING',
    });

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 45);
    const endDate = new Date(startDate.getTime() + 9 * 24 * 60 * 60 * 1000);

    const response = await request(app.server)
      .patch(`/v1/hr/vacation-periods/${vacationPeriodId}/schedule`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        days: 10,
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBeDefined();
  });

  it('should return 404 for non-existent vacation period', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .patch(
        '/v1/hr/vacation-periods/00000000-0000-0000-0000-000000000000/schedule',
      )
      .set('Authorization', `Bearer ${token}`)
      .send({
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        days: 10,
      });

    expect(response.statusCode).toBe(404);
  });

  it('should return 401 when no token is provided', async () => {
    const response = await request(app.server)
      .patch(
        '/v1/hr/vacation-periods/00000000-0000-0000-0000-000000000000/schedule',
      )
      .send({
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        days: 10,
      });

    expect(response.statusCode).toBe(401);
  });
});

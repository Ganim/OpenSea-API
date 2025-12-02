import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';
import {
  createAvailableVacationPeriodE2E,
  createInProgressVacationPeriodE2E,
} from '@/utils/tests/factories/hr/create-vacation-period.e2e';

describe('Complete Vacation (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should complete an in-progress vacation', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const { employeeId } = await createEmployeeE2E();
    const { vacationPeriodId } = await createInProgressVacationPeriodE2E({
      employeeId,
      totalDays: 30,
      remainingDays: 30,
    });

    const response = await request(app.server)
      .patch(`/v1/hr/vacation-periods/${vacationPeriodId}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        daysUsed: 15,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.vacationPeriod).toBeDefined();
    expect(response.body.vacationPeriod.usedDays).toBe(15);
    expect(response.body.vacationPeriod.remainingDays).toBe(15);
  });

  it('should complete with all days and set status to COMPLETED', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const { employeeId } = await createEmployeeE2E();
    const { vacationPeriodId } = await createInProgressVacationPeriodE2E({
      employeeId,
      totalDays: 30,
      remainingDays: 30,
    });

    const response = await request(app.server)
      .patch(`/v1/hr/vacation-periods/${vacationPeriodId}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        daysUsed: 30,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.vacationPeriod).toBeDefined();
    expect(response.body.vacationPeriod.status).toBe('COMPLETED');
    expect(response.body.vacationPeriod.remainingDays).toBe(0);
  });

  it('should not complete non-in-progress vacation', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const { employeeId } = await createEmployeeE2E();
    const { vacationPeriodId } = await createAvailableVacationPeriodE2E({
      employeeId,
    });

    const response = await request(app.server)
      .patch(`/v1/hr/vacation-periods/${vacationPeriodId}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        daysUsed: 10,
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBeDefined();
  });

  it('should not complete with more days than remaining', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const { employeeId } = await createEmployeeE2E();
    const { vacationPeriodId } = await createInProgressVacationPeriodE2E({
      employeeId,
      totalDays: 30,
      usedDays: 20,
      remainingDays: 10,
    });

    const response = await request(app.server)
      .patch(`/v1/hr/vacation-periods/${vacationPeriodId}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        daysUsed: 20, // Mais do que os 10 restantes
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBeDefined();
  });

  it('should return 404 for non-existent vacation period', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const response = await request(app.server)
      .patch(
        '/v1/hr/vacation-periods/00000000-0000-0000-0000-000000000000/complete',
      )
      .set('Authorization', `Bearer ${token}`)
      .send({
        daysUsed: 10,
      });

    expect(response.statusCode).toBe(404);
  });

  it('should return 401 when no token is provided', async () => {
    const response = await request(app.server)
      .patch(
        '/v1/hr/vacation-periods/00000000-0000-0000-0000-000000000000/complete',
      )
      .send({
        daysUsed: 10,
      });

    expect(response.statusCode).toBe(401);
  });
});

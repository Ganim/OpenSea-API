import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';
import {
    createAvailableVacationPeriodE2E,
    createCompletedVacationPeriodE2E,
} from '@/utils/tests/factories/hr/create-vacation-period.e2e';

describe('Sell Vacation Days (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should sell vacation days (abono pecuniário)', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const { employeeId } = await createEmployeeE2E();
    const { vacationPeriodId } = await createAvailableVacationPeriodE2E({
      employeeId,
      totalDays: 30,
      remainingDays: 30,
      soldDays: 0,
    });

    const response = await request(app.server)
      .patch(`/v1/hr/vacation-periods/${vacationPeriodId}/sell`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        daysToSell: 10,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.vacationPeriod).toBeDefined();
    expect(response.body.vacationPeriod.soldDays).toBe(10);
    expect(response.body.vacationPeriod.remainingDays).toBe(20);
  });

  it('should not sell more than 10 days (1/3 of vacation)', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const { employeeId } = await createEmployeeE2E();
    const { vacationPeriodId } = await createAvailableVacationPeriodE2E({
      employeeId,
      totalDays: 30,
      remainingDays: 30,
      soldDays: 5, // Já vendeu 5 dias
    });

    const response = await request(app.server)
      .patch(`/v1/hr/vacation-periods/${vacationPeriodId}/sell`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        daysToSell: 10, // Tenta vender mais 10, mas só pode vender 5
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBeDefined();
  });

  it('should not sell days from completed period', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const { employeeId } = await createEmployeeE2E();
    const { vacationPeriodId } = await createCompletedVacationPeriodE2E({
      employeeId,
    });

    const response = await request(app.server)
      .patch(`/v1/hr/vacation-periods/${vacationPeriodId}/sell`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        daysToSell: 5,
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBeDefined();
  });

  it('should return 404 for non-existent vacation period', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const response = await request(app.server)
      .patch(
        '/v1/hr/vacation-periods/00000000-0000-0000-0000-000000000000/sell',
      )
      .set('Authorization', `Bearer ${token}`)
      .send({
        daysToSell: 5,
      });

    expect(response.statusCode).toBe(404);
  });

  it('should return 401 when no token is provided', async () => {
    const response = await request(app.server)
      .patch(
        '/v1/hr/vacation-periods/00000000-0000-0000-0000-000000000000/sell',
      )
      .send({
        daysToSell: 5,
      });

    expect(response.statusCode).toBe(401);
  });
});

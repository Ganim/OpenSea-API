import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';
import {
  createAvailableVacationPeriodE2E,
  createScheduledVacationPeriodE2E,
} from '@/utils/tests/factories/hr/create-vacation-period.e2e';

describe('Start Vacation (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should start a scheduled vacation', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const { employeeId } = await createEmployeeE2E();
    const { vacationPeriodId } = await createScheduledVacationPeriodE2E({
      employeeId,
    });

    const response = await request(app.server)
      .patch(`/v1/hr/vacation-periods/${vacationPeriodId}/start`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.vacationPeriod).toBeDefined();
    expect(response.body.vacationPeriod.status).toBe('IN_PROGRESS');
  });

  it('should not start non-scheduled vacation', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const { employeeId } = await createEmployeeE2E();
    const { vacationPeriodId } = await createAvailableVacationPeriodE2E({
      employeeId,
    });

    const response = await request(app.server)
      .patch(`/v1/hr/vacation-periods/${vacationPeriodId}/start`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBeDefined();
  });

  it('should return 404 for non-existent vacation period', async () => {
    const { token } = await createAndAuthenticateUser(app, 'MANAGER');

    const response = await request(app.server)
      .patch(
        '/v1/hr/vacation-periods/00000000-0000-0000-0000-000000000000/start',
      )
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
  });

  it('should return 401 when no token is provided', async () => {
    const response = await request(app.server).patch(
      '/v1/hr/vacation-periods/00000000-0000-0000-0000-000000000000/start',
    );

    expect(response.statusCode).toBe(401);
  });
});

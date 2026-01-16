import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';
import { createVacationPeriodE2E } from '@/utils/tests/factories/hr/create-vacation-period.e2e';

describe('Get Vacation Period (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get vacation period by id with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const { employeeId } = await createEmployeeE2E();
    const { vacationPeriodId } = await createVacationPeriodE2E({
      employeeId,
      totalDays: 30,
      status: 'AVAILABLE',
    });

    const response = await request(app.server)
      .get(`/v1/hr/vacation-periods/${vacationPeriodId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.vacationPeriod).toBeDefined();
    expect(response.body.vacationPeriod.id).toBe(vacationPeriodId);
    expect(response.body.vacationPeriod.employeeId).toBe(employeeId);
    expect(response.body.vacationPeriod.totalDays).toBe(30);
  });
});

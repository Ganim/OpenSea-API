import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';
import { createInProgressVacationPeriodE2E } from '@/utils/tests/factories/hr/create-vacation-period.e2e';

describe('Complete Vacation (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should complete an in-progress vacation with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const { employeeId, employee } = await createEmployeeE2E();
    const { vacationPeriodId } = await createInProgressVacationPeriodE2E({
      tenantId: employee.tenantId,
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
});

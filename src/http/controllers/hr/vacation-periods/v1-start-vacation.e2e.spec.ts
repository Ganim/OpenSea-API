import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';
import { createScheduledVacationPeriodE2E } from '@/utils/tests/factories/hr/create-vacation-period.e2e';

describe('Start Vacation (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should start a scheduled vacation with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const { employeeId, employee } = await createEmployeeE2E();
    const { vacationPeriodId } = await createScheduledVacationPeriodE2E({
      tenantId: employee.tenantId,
      employeeId,
    });

    const response = await request(app.server)
      .patch(`/v1/hr/vacation-periods/${vacationPeriodId}/start`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.vacationPeriod).toBeDefined();
    expect(response.body.vacationPeriod.status).toBe('IN_PROGRESS');
  });
});

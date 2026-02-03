import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';
import { createAvailableVacationPeriodE2E } from '@/utils/tests/factories/hr/create-vacation-period.e2e';

describe('Schedule Vacation (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should schedule vacation with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { employeeId } = await createEmployeeE2E({ tenantId });
    const { vacationPeriodId } = await createAvailableVacationPeriodE2E({
      tenantId,
      employeeId,
      remainingDays: 30,
    });

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 45);
    const endDate = new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000);

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
});

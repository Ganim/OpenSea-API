import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';
import { createAvailableVacationPeriodE2E } from '@/utils/tests/factories/hr/create-vacation-period.e2e';

describe('Sell Vacation Days (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should sell vacation days with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { employeeId } = await createEmployeeE2E({ tenantId });
    const { vacationPeriodId } = await createAvailableVacationPeriodE2E({
      tenantId,
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
});

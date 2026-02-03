import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';
import { createAvailableVacationPeriodE2E } from '@/utils/tests/factories/hr/create-vacation-period.e2e';

describe('Request Vacation (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should request vacation with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const { employeeId } = await createEmployeeE2E({ tenantId, status: 'ACTIVE' });
    const { vacationPeriodId } = await createAvailableVacationPeriodE2E({
      tenantId,
      employeeId,
      remainingDays: 30,
    });

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 45);
    const endDate = new Date(startDate.getTime() + 9 * 24 * 60 * 60 * 1000);

    const response = await request(app.server)
      .post('/v1/hr/absences/vacation')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeId,
        vacationPeriodId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        reason: 'Férias programadas',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('absence');
  });
});

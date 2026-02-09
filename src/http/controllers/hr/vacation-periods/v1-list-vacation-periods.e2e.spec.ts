import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';
import { createVacationPeriodE2E } from '@/utils/tests/factories/hr/create-vacation-period.e2e';

describe('List Vacation Periods (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list vacation periods with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { employeeId } = await createEmployeeE2E({ tenantId });

    await createVacationPeriodE2E({ tenantId, employeeId, status: 'PENDING' });
    await createVacationPeriodE2E({
      tenantId,
      employeeId,
      status: 'AVAILABLE',
    });

    const response = await request(app.server)
      .get('/v1/hr/vacation-periods')
      .set('Authorization', `Bearer ${token}`)
      .query({ page: 1, perPage: 10 });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('vacationPeriods');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.vacationPeriods)).toBe(true);
  });
});

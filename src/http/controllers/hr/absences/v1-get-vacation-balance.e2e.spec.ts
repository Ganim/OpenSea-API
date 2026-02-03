import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';
import { createAvailableVacationPeriodE2E } from '@/utils/tests/factories/hr/create-vacation-period.e2e';

describe('Get Vacation Balance (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get vacation balance with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const { employeeId, employee } = await createEmployeeE2E({ fullName: 'João Silva' });

    await createAvailableVacationPeriodE2E({
      tenantId: employee.tenantId,
      employeeId,
      totalDays: 30,
      usedDays: 10,
      soldDays: 0,
      remainingDays: 20,
    });

    const response = await request(app.server)
      .get(`/v1/hr/employees/${employeeId}/vacation-balance`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('employeeId');
    expect(response.body).toHaveProperty('periods');
  });
});

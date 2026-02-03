import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createAbsenceE2E } from '@/utils/tests/factories/hr/create-absence.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Get Absence (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get absence with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const { employeeId } = await createEmployeeE2E({ tenantId });
    const { absenceId } = await createAbsenceE2E({
      tenantId,
      employeeId,
      type: 'VACATION',
    });

    const response = await request(app.server)
      .get(`/v1/hr/absences/${absenceId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('absence');
    expect(response.body.absence).toHaveProperty('id');
  });
});

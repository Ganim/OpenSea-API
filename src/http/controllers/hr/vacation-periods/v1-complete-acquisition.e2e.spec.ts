import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';
import { createVacationPeriodE2E } from '@/utils/tests/factories/hr/create-vacation-period.e2e';

describe('Complete Acquisition (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should complete an acquisition period', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { employeeId } = await createEmployeeE2E({ tenantId });
    const { vacationPeriodId } = await createVacationPeriodE2E({
      tenantId,
      employeeId,
      status: 'PENDING',
    });

    const response = await request(app.server)
      .patch(`/v1/hr/vacation-periods/${vacationPeriodId}/complete-acquisition`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe(
      'Período aquisitivo concluído com sucesso',
    );
  });
});

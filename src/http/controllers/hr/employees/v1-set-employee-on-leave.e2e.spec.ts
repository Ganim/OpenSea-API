import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Set Employee On Leave (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const tenant = await createAndSetupTenant();
    tenantId = tenant.tenantId;
  });


  it('should set employee on leave with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { employee } = await createEmployeeE2E({
      tenantId,
      status: 'ACTIVE',
    });

    const response = await request(app.server)
      .patch(`/v1/hr/employees/${employee.id}/on-leave`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        reason: 'Motivo do afastamento',
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('employee');
    expect(response.body.employee.status).toBe('ON_LEAVE');
  });
});

import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Credit Time Bank (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should credit hours to time bank with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { employeeId } = await createEmployeeE2E({ tenantId });

    const response = await request(app.server)
      .post('/v1/hr/time-bank/credit')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeId,
        hours: 5,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('timeBank');
    expect(response.body.timeBank.balance).toBe(5);
  });
});

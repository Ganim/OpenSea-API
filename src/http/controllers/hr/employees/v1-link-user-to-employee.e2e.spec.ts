import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Link User to Employee (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const tenant = await createAndSetupTenant();
    tenantId = tenant.tenantId;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should link user to employee with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { employee } = await createEmployeeE2E({ tenantId });
    const { user: userToLink } = await createAndAuthenticateUser(app, {
      tenantId,
    });

    const response = await request(app.server)
      .post(`/v1/hr/employees/${employee.id}/link-user`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        userId: userToLink.user.id,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('employee');
    expect(response.body.employee.userId).toBe(userToLink.user.id);
  });
});

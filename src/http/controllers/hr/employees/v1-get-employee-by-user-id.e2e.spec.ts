import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Get Employee By User Id (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const tenant = await createAndSetupTenant();
    tenantId = tenant.tenantId;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get employee by user id', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });

    // Create employee linked to user
    const { employee } = await createEmployeeE2E({
      tenantId,
      userId: user.user.id,
    });

    const response = await request(app.server)
      .get(`/v1/hr/employees/by-user/${user.user.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('employee');
    expect(response.body.employee.id).toBe(employee.id);
  });

  it('should return 404 when no employee linked to user', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get(`/v1/hr/employees/by-user/${user.user.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).get(
      '/v1/hr/employees/by-user/00000000-0000-0000-0000-000000000000',
    );

    expect(response.statusCode).toBe(401);
  });
});

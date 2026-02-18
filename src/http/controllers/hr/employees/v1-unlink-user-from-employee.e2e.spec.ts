import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Unlink User from Employee (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const tenant = await createAndSetupTenant();
    tenantId = tenant.tenantId;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should unlink user from employee', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { user: userToLink } = await createAndAuthenticateUser(app, {
      tenantId,
    });

    // Create employee linked to a user
    const { employee } = await createEmployeeE2E({
      tenantId,
      userId: userToLink.user.id,
    });

    const response = await request(app.server)
      .post(`/v1/hr/employees/${employee.id}/unlink-user`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('employee');
    expect(response.body.employee.userId).toBeNull();
  });

  it('should return 404 when employee not found', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/hr/employees/00000000-0000-0000-0000-000000000000/unlink-user')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(404);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).post(
      '/v1/hr/employees/00000000-0000-0000-0000-000000000000/unlink-user',
    );

    expect(response.statusCode).toBe(401);
  });
});

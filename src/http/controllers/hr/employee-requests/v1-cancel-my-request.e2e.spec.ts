import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';
import { createEmployeeRequestE2E } from '@/utils/tests/factories/hr/create-employee-request.e2e';

describe('Cancel My Request (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should cancel a pending request', async () => {
    const { token, user: userResponse } = await createAndAuthenticateUser(app, {
      tenantId,
    });

    const userId = userResponse.user.id.toString();
    const { employeeId } = await createEmployeeE2E({
      tenantId,
      userId,
      status: 'ACTIVE',
    });

    const { employeeRequestId } = await createEmployeeRequestE2E({
      tenantId,
      employeeId,
      type: 'VACATION',
      status: 'PENDING',
    });

    const response = await request(app.server)
      .delete(`/v1/hr/my/requests/${employeeRequestId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('employeeRequest');
    expect(response.body.employeeRequest.status).toBe('CANCELLED');
  });

  it('should return 404 for non-existent request', async () => {
    const { token, user: userResponse } = await createAndAuthenticateUser(app, {
      tenantId,
    });

    const userId = userResponse.user.id.toString();
    await createEmployeeE2E({ tenantId, userId, status: 'ACTIVE' });

    const response = await request(app.server)
      .delete('/v1/hr/my/requests/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
  });
});

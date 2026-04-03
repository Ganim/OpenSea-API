import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';
import { createEmployeeRequestE2E } from '@/utils/tests/factories/hr/create-employee-request.e2e';

describe('List My Requests (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should list employee requests with pagination', async () => {
    const { token, user: userResponse } = await createAndAuthenticateUser(app, {
      tenantId,
    });

    const userId = userResponse.user.id.toString();
    const { employeeId } = await createEmployeeE2E({
      tenantId,
      userId,
      status: 'ACTIVE',
    });

    await createEmployeeRequestE2E({ tenantId, employeeId, type: 'VACATION' });
    await createEmployeeRequestE2E({ tenantId, employeeId, type: 'ABSENCE' });

    const response = await request(app.server)
      .get('/v1/hr/my/requests')
      .set('Authorization', `Bearer ${token}`)
      .query({ page: 1, limit: 20 });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('employeeRequests');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.employeeRequests)).toBe(true);
    expect(response.body.employeeRequests.length).toBeGreaterThanOrEqual(2);
    expect(response.body.meta).toHaveProperty('total');
    expect(response.body.meta).toHaveProperty('page');
    expect(response.body.meta).toHaveProperty('limit');
    expect(response.body.meta).toHaveProperty('pages');
  });

  it('should return 404 when user has no linked employee', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/hr/my/requests')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
  });
});

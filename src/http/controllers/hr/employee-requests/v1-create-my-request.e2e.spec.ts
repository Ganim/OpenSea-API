import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Create My Request (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should create a new employee request', async () => {
    const { token, user: userResponse } = await createAndAuthenticateUser(app, {
      tenantId,
    });

    const userId = userResponse.user.id.toString();
    await createEmployeeE2E({ tenantId, userId, status: 'ACTIVE' });

    const response = await request(app.server)
      .post('/v1/hr/my/requests')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'VACATION',
        data: { startDate: '2026-05-01', endDate: '2026-05-15' },
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('employeeRequest');
    expect(response.body.employeeRequest).toHaveProperty('id');
    expect(response.body.employeeRequest.type).toBe('VACATION');
    expect(response.body.employeeRequest.status).toBe('PENDING');
  });

  it('should return 404 when user has no linked employee', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/hr/my/requests')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'SUPPORT',
        data: {},
      });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
  });
});

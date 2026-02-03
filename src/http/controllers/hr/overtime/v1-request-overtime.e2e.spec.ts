import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Request Overtime (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create an overtime request with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { employeeId } = await createEmployeeE2E({ tenantId });

    const response = await request(app.server)
      .post('/v1/hr/overtime')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeId,
        date: '2024-01-15',
        hours: 2,
        reason: 'Project deadline - need extra hours to complete delivery',
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('overtime');
    expect(response.body.overtime.employeeId).toBe(employeeId);
    expect(response.body.overtime.hours).toBe(2);
    expect(response.body.overtime.approved).toBe(false);
  });
});

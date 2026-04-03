import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Create Warning (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should create a warning', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { employeeId } = await createEmployeeE2E({ tenantId });

    const response = await request(app.server)
      .post('/v1/hr/warnings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeId,
        type: 'VERBAL',
        severity: 'MINOR',
        reason: 'Test warning reason',
        description: 'Test warning description',
        date: new Date().toISOString(),
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('warning');
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server)
      .post('/v1/hr/warnings')
      .send({
        employeeId: '00000000-0000-0000-0000-000000000000',
        type: 'VERBAL',
        severity: 'MINOR',
        reason: 'Test',
        description: 'Test',
        date: new Date().toISOString(),
      });

    expect(response.status).toBe(401);
  });
});

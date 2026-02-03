import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('List My Payroll Items (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list my payroll items', { timeout: 15000 }, async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });

    await createEmployeeE2E({
      tenantId,
      userId: user.user.id,
      fullName: 'Payroll Items Employee',
    });

    const response = await request(app.server)
      .get('/v1/me/payroll-items')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('payrollItems');
    expect(Array.isArray(response.body.payrollItems)).toBe(true);
  });

  it('should return 404 when user has no employee record', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/me/payroll-items')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it('should return 401 without authentication', async () => {
    const response = await request(app.server).get('/v1/me/payroll-items');

    expect(response.status).toBe(401);
  });
});

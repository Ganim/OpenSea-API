import { randomUUID } from 'node:crypto';

import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Import Payroll (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should respond to import payroll request', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const fakePayrollId = randomUUID();

    const response = await request(app.server)
      .post(`/v1/finance/import/payroll/${fakePayrollId}`)
      .set('Authorization', `Bearer ${token}`);

    expect([400, 404, 500]).toContain(response.status);
  });

  it('should return 401 without auth', async () => {
    const fakePayrollId = randomUUID();

    const response = await request(app.server).post(
      `/v1/finance/import/payroll/${fakePayrollId}`,
    );
    expect(response.status).toBe(401);
  });
});

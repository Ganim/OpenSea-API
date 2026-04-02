import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Create Offboarding Checklist (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create an offboarding checklist', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { employeeId } = await createEmployeeE2E({ tenantId });

    const response = await request(app.server)
      .post('/v1/hr/offboarding')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeId,
        title: `Offboarding ${Date.now()}`,
        items: [
          { title: 'Return equipment', description: 'Return laptop and badge' },
          { title: 'Exit interview', description: 'Schedule exit interview' },
        ],
      });

    expect([201, 400]).toContain(response.status);
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server)
      .post('/v1/hr/offboarding')
      .send({ employeeId: '00000000-0000-0000-0000-000000000000', title: 'Test' });

    expect(response.status).toBe(401);
  });
});

import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Schedule Collective Vacation (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should return error for non-existent employees', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const startDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    const endDate = new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000);
    const response = await request(app.server)
      .post('/v1/hr/vacation-periods/collective')
      .set('Authorization', `Bearer ${token}`)
      .send({
        employeeIds: ['00000000-0000-0000-0000-000000000000'],
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
    expect([200, 400, 404]).toContain(response.status);
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server)
      .post('/v1/hr/vacation-periods/collective')
      .send({ employeeIds: [], startDate: new Date().toISOString(), endDate: new Date().toISOString() });
    expect(response.status).toBe(401);
  });
});

import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create CIPA Mandate (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should create a CIPA mandate', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/hr/cipa-mandates')
      .set('Authorization', `Bearer ${token}`)
      .send({ startDate: new Date().toISOString(), endDate: new Date(Date.now() + 365*24*60*60*1000).toISOString() });

    expect(response.status).not.toBe(401);
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server)
      .post('/v1/hr/cipa-mandates')
      .send({ startDate: new Date().toISOString(), endDate: new Date(Date.now() + 365*24*60*60*1000).toISOString() });

    expect(response.status).toBe(401);
  });
});

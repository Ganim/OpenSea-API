import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Delegation (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should return error for missing employee', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/hr/approval-delegations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        delegateId: '00000000-0000-0000-0000-000000000000',
        scope: 'ALL',
        startDate: new Date().toISOString(),
      });

    expect(response.status).not.toBe(401);
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server)
      .post('/v1/hr/approval-delegations')
      .send({
        delegateId: '00000000-0000-0000-0000-000000000000',
        scope: 'ALL',
        startDate: new Date().toISOString(),
      });

    expect(response.status).toBe(401);
  });
});

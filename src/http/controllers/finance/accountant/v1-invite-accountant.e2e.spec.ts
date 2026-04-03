import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Invite Accountant (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should invite an accountant', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/finance/accountant/invite')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: `accountant-${Date.now()}@test.com`,
        name: 'Test Accountant',
      });

    expect(response.status).toBe(201);
    expect(response.body).toBeDefined();
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server)
      .post('/v1/finance/accountant/invite')
      .send({
        email: 'accountant@test.com',
        name: 'Test Accountant',
      });

    expect(response.status).toBe(401);
  });
});

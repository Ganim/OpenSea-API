import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Get Customer Score (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should get customer payment reliability score', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/finance/customers/TestCustomer/score')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('score');
    expect(response.body).toHaveProperty('rating');
    expect(response.body).toHaveProperty('totalEntries');
    expect(response.body.customerName).toBe('TestCustomer');
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).get(
      '/v1/finance/customers/TestCustomer/score',
    );
    expect(response.status).toBe(401);
  });
});

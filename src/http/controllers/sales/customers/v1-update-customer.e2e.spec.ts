import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Update Customer (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should update customer with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    // Create a customer first
    const createResponse = await request(app.server)
      .post('/v1/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Customer Update ${timestamp}`,
        type: 'INDIVIDUAL',
      });

    const customerId = createResponse.body.customer.id;

    const response = await request(app.server)
      .put(`/v1/customers/${customerId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Updated Customer ${timestamp}`,
        email: `updated${timestamp}@example.com`,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('customer');
    expect(response.body.customer).toHaveProperty(
      'name',
      `Updated Customer ${timestamp}`,
    );
  });
});

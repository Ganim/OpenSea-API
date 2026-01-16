import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Create Customer (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create customer with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Customer ${timestamp}`,
        type: 'BUSINESS',
        email: `customer${timestamp}@example.com`,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('customer');
    expect(response.body.customer).toHaveProperty('id');
    expect(response.body.customer).toHaveProperty('name');
    expect(response.body.customer).toHaveProperty('type', 'BUSINESS');
  });
});

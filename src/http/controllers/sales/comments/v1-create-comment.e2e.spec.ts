import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Create Comment (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create comment with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);

    // Create a customer to comment on
    const timestamp = Date.now();
    const customerResponse = await request(app.server)
      .post('/v1/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Customer ${timestamp}`,
        type: 'BUSINESS',
      });
    const customerId = customerResponse.body.customer.id;

    const response = await request(app.server)
      .post('/v1/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        entityType: 'CUSTOMER',
        entityId: customerId,
        content: 'This is a test comment on a customer',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('comment');
    expect(response.body.comment).toHaveProperty('id');
    expect(response.body.comment).toHaveProperty('content');
    expect(response.body.comment).toHaveProperty('entityType', 'CUSTOMER');
  });
});

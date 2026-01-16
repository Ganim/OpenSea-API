import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Get Comment By ID (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get comment by id with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);

    // Create a customer
    const timestamp = Date.now();
    const customerResponse = await request(app.server)
      .post('/v1/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Customer ${timestamp}`,
        type: 'BUSINESS',
      });
    const customerId = customerResponse.body.customer.id;

    // Create a comment
    const commentResponse = await request(app.server)
      .post('/v1/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        entityType: 'CUSTOMER',
        entityId: customerId,
        content: 'Test comment for get by id',
      });
    const commentId = commentResponse.body.comment.id;

    const response = await request(app.server)
      .get(`/v1/comments/${commentId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('comment');
    expect(response.body.comment).toHaveProperty('id', commentId);
    expect(response.body.comment).toHaveProperty('content');
    expect(response.body.comment).toHaveProperty('entityType');
  });
});

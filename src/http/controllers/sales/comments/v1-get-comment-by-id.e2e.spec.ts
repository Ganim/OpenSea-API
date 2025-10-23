import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Get Comment By ID (E2E)', () => {
  let userToken: string;
  let userId: string;
  let customerId: string;
  let commentId: string;

  beforeAll(async () => {
    await app.ready();

    const { token, user } = await createAndAuthenticateUser(app, 'USER');
    userToken = token;
    userId = user.user.id;

    // Create a customer
    const timestamp = Date.now();
    const customerResponse = await request(app.server)
      .post('/v1/customers')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: `Customer ${timestamp}`,
        type: 'BUSINESS',
      });
    customerId = customerResponse.body.customer.id;

    // Create a comment
    const commentResponse = await request(app.server)
      .post('/v1/comments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        entityType: 'CUSTOMER',
        entityId: customerId,
        content: 'Test comment for get by id',
      });
    commentId = commentResponse.body.comment.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to get a comment by id', async () => {
    const response = await request(app.server)
      .get(`/v1/comments/${commentId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      comment: {
        id: commentId,
        entityType: 'CUSTOMER',
        entityId: customerId,
        userId: userId,
        content: 'Test comment for get by id',
        createdAt: expect.any(String),
      },
    });
  });

  it('should not be able to get a comment without authentication', async () => {
    const response = await request(app.server).get(`/v1/comments/${commentId}`);

    expect(response.status).toBe(401);
  });

  it('should return 404 when comment does not exist', async () => {
    const fakeUuid = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .get(`/v1/comments/${fakeUuid}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(404);
  });
});

import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Update Comment (E2E)', () => {
  let userToken: string;
  let userId: string;
  let customerId: string;
  let commentId: string;

  beforeAll(async () => {
    await app.ready();

    const { token, user } = await createAndAuthenticateUser(app);
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
        content: 'Original comment content',
      });
    commentId = commentResponse.body.comment.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to update a comment', async () => {
    const response = await request(app.server)
      .put(`/v1/comments/${commentId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        content: 'Updated comment content',
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      comment: {
        id: commentId,
        entityType: 'CUSTOMER',
        entityId: customerId,
        userId: userId,
        content: 'Updated comment content',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    });
  });

  it('should not be able to update a comment without authentication', async () => {
    const response = await request(app.server)
      .put(`/v1/comments/${commentId}`)
      .send({
        content: 'Unauthorized update',
      });

    expect(response.status).toBe(401);
  });

  it('should not be able to update another user comment', async () => {
    // Create another user
    const { token: anotherUserToken } = await createAndAuthenticateUser(
      app,
    );

    const response = await request(app.server)
      .put(`/v1/comments/${commentId}`)
      .set('Authorization', `Bearer ${anotherUserToken}`)
      .send({
        content: 'Trying to update another user comment',
      });

    expect(response.status).toBe(403);
  });

  it('should not be able to update a non-existent comment', async () => {
    const fakeUuid = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .put(`/v1/comments/${fakeUuid}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        content: 'Updated content',
      });

    expect(response.status).toBe(404);
  });

  it('should not be able to update a comment with empty content', async () => {
    const response = await request(app.server)
      .put(`/v1/comments/${commentId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        content: '',
      });

    expect(response.status).toBe(400);
  });
});

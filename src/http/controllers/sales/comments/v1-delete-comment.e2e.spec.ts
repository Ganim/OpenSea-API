import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Delete Comment (E2E)', () => {
  let userToken: string;
  let customerId: string;

  beforeAll(async () => {
    await app.ready();

    const { token } = await createAndAuthenticateUser(app, 'USER');
    userToken = token;

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
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to delete a comment', async () => {
    // Create a comment
    const commentResponse = await request(app.server)
      .post('/v1/comments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        entityType: 'CUSTOMER',
        entityId: customerId,
        content: 'Comment to be deleted',
      });
    const commentId = commentResponse.body.comment.id;

    // Delete the comment
    const response = await request(app.server)
      .delete(`/v1/comments/${commentId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(204);
  });

  it('should not be able to delete a comment without authentication', async () => {
    // Create a comment
    const commentResponse = await request(app.server)
      .post('/v1/comments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        entityType: 'CUSTOMER',
        entityId: customerId,
        content: 'Comment for unauthorized delete',
      });
    const commentId = commentResponse.body.comment.id;

    const response = await request(app.server).delete(
      `/v1/comments/${commentId}`,
    );

    expect(response.status).toBe(401);
  });

  it('should not be able to delete another user comment', async () => {
    // Create a comment with first user
    const commentResponse = await request(app.server)
      .post('/v1/comments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        entityType: 'CUSTOMER',
        entityId: customerId,
        content: 'Comment to be deleted by another user',
      });
    const commentId = commentResponse.body.comment.id;

    // Create another user
    const { token: anotherUserToken } = await createAndAuthenticateUser(
      app,
      'USER',
    );

    // Try to delete with another user
    const response = await request(app.server)
      .delete(`/v1/comments/${commentId}`)
      .set('Authorization', `Bearer ${anotherUserToken}`);

    expect(response.status).toBe(403);
  });

  it('should not be able to delete a non-existent comment', async () => {
    const fakeUuid = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .delete(`/v1/comments/${fakeUuid}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(404);
  });
});

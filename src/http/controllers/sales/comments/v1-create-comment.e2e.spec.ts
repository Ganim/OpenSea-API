import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Create Comment (E2E)', () => {
  let userToken: string;
  let userId: string;
  let customerId: string;

  beforeAll(async () => {
    await app.ready();

    const { token, user } = await createAndAuthenticateUser(app, 'USER');
    userToken = token;
    userId = user.user.id;

    // Create a customer to comment on
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

  it('should be able to create a comment on a customer', async () => {
    const response = await request(app.server)
      .post('/v1/comments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        entityType: 'CUSTOMER',
        entityId: customerId,
        content: 'This is a test comment on a customer',
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      comment: {
        id: expect.any(String),
        entityType: 'CUSTOMER',
        entityId: customerId,
        userId: userId,
        content: 'This is a test comment on a customer',
        createdAt: expect.any(String),
      },
    });
  });

  it('should be able to create a reply to a comment', async () => {
    // Create parent comment
    const parentResponse = await request(app.server)
      .post('/v1/comments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        entityType: 'CUSTOMER',
        entityId: customerId,
        content: 'Parent comment',
      });

    const parentCommentId = parentResponse.body.comment.id;

    // Create reply
    const replyResponse = await request(app.server)
      .post('/v1/comments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        entityType: 'CUSTOMER',
        entityId: customerId,
        content: 'This is a reply',
        parentCommentId: parentCommentId,
      });

    expect(replyResponse.status).toBe(201);
    expect(replyResponse.body).toMatchObject({
      comment: {
        id: expect.any(String),
        entityType: 'CUSTOMER',
        entityId: customerId,
        userId: userId,
        content: 'This is a reply',
        parentCommentId: parentCommentId,
        createdAt: expect.any(String),
      },
    });
  });

  it('should not be able to create a comment without authentication', async () => {
    const response = await request(app.server).post('/v1/comments').send({
      entityType: 'CUSTOMER',
      entityId: customerId,
      content: 'Unauthorized comment',
    });

    expect(response.status).toBe(401);
  });

  it('should not be able to create a comment with invalid entity type', async () => {
    const response = await request(app.server)
      .post('/v1/comments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        entityType: 'INVALID',
        entityId: customerId,
        content: 'Invalid entity type comment',
      });

    expect(response.status).toBe(400);
  });

  it('should not be able to create a comment with empty content', async () => {
    const response = await request(app.server)
      .post('/v1/comments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        entityType: 'CUSTOMER',
        entityId: customerId,
        content: '',
      });

    expect(response.status).toBe(400);
  });

  it('should not be able to create a comment with non-existent parent', async () => {
    const fakeUuid = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .post('/v1/comments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        entityType: 'CUSTOMER',
        entityId: customerId,
        content: 'Reply to non-existent comment',
        parentCommentId: fakeUuid,
      });

    expect(response.status).toBe(404);
  });
});

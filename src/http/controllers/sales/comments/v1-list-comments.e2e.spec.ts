import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('List Comments (E2E)', () => {
  let userToken: string;
  let userId: string;
  let customerId: string;

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

    // Create some comments
    await request(app.server)
      .post('/v1/comments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        entityType: 'CUSTOMER',
        entityId: customerId,
        content: 'First comment',
      });

    await request(app.server)
      .post('/v1/comments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        entityType: 'CUSTOMER',
        entityId: customerId,
        content: 'Second comment',
      });
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to list comments by entity', async () => {
    const response = await request(app.server)
      .get('/v1/comments')
      .query({
        entityType: 'CUSTOMER',
        entityId: customerId,
      })
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.comments).toHaveLength(2);
    expect(response.body.comments[0]).toMatchObject({
      id: expect.any(String),
      entityType: 'CUSTOMER',
      entityId: customerId,
      content: expect.any(String),
      createdAt: expect.any(String),
    });
  });

  it('should be able to list comments by author', async () => {
    const response = await request(app.server)
      .get('/v1/comments')
      .query({
        authorId: userId,
      })
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.comments.length).toBeGreaterThanOrEqual(2);
  });

  it('should not be able to list comments without authentication', async () => {
    const response = await request(app.server).get('/v1/comments').query({
      entityType: 'CUSTOMER',
      entityId: customerId,
    });

    expect(response.status).toBe(401);
  });

  it('should return empty array when no filters are provided', async () => {
    const response = await request(app.server)
      .get('/v1/comments')
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.comments).toEqual([]);
  });
});

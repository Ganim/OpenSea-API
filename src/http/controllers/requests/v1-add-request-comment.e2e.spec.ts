import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createRequestE2E } from '@/utils/tests/factories/core/create-request.e2e';
import type { FastifyInstance } from 'fastify';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let token: string;
let user: { user: { id: string } };
let adminToken: string;

describe('Add Request Comment (E2E)', () => {
  beforeAll(async () => {
    await app.ready();

    const userAuthData = await createAndAuthenticateUser(
      app as unknown as FastifyInstance,
      'USER',
    );
    token = userAuthData.token;
    user = userAuthData.user;

    const adminAuthData = await createAndAuthenticateUser(
      app as unknown as FastifyInstance,
      'ADMIN',
    );
    adminToken = adminAuthData.token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to add comment as the requester', async () => {
    // Create a test request
    const testRequest = await createRequestE2E({
      targetId: user.user.id,
      requesterId: user.user.id,
    });

    const response = await request(app.server)
      .post(`/v1/requests/${testRequest.id}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: 'This is a test comment from the requester',
      });

    expect(response.status).toBe(201);
    expect(response.body).toBeDefined();
    expect(response.body.id).toBeDefined();
    expect(response.body.content).toBe(
      'This is a test comment from the requester',
    );
    expect(response.body.createdAt).toBeDefined();

    // Verify comment was created in database
    const commentInDb = await prisma.requestComment.findFirst({
      where: { requestId: testRequest.id },
    });

    expect(commentInDb).toBeDefined();
    expect(commentInDb?.content).toBe(
      'This is a test comment from the requester',
    );
  });

  it('should be able to add comment as the assigned user', async () => {
    const adminAuthData = await createAndAuthenticateUser(
      app as unknown as FastifyInstance,
      'ADMIN',
    );

    // Create a test request assigned to admin
    const testRequest = await createRequestE2E({
      targetId: user.user.id,
      requesterId: user.user.id,
      status: 'IN_PROGRESS',
      assignedToId: adminAuthData.user.user.id,
    });

    const response = await request(app.server)
      .post(`/v1/requests/${testRequest.id}/comments`)
      .set('Authorization', `Bearer ${adminAuthData.token}`)
      .send({
        content: 'This is a test comment from the assigned user',
        isInternal: true,
      });

    expect(response.status).toBe(201);
    expect(response.body).toBeDefined();
    expect(response.body.content).toBe(
      'This is a test comment from the assigned user',
    );
  });

  it('should be able to add comment as admin', async () => {
    const timestamp = Date.now();

    // Create a test request for another user
    const otherUserAuth = await createAndAuthenticateUser(
      app as unknown as FastifyInstance,
      'USER',
    );

    const testRequest = await prisma.request.create({
      data: {
        title: `Test Request ${timestamp}`,
        description: 'Test description for comment',
        type: 'ACCESS_REQUEST',
        priority: 'MEDIUM',
        status: 'SUBMITTED',
        targetType: 'USER',
        targetId: otherUserAuth.user.user.id,
        requesterId: otherUserAuth.user.user.id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const response = await request(app.server)
      .post(`/v1/requests/${testRequest.id}/comments`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        content: 'This is a test comment from admin',
      });

    expect(response.status).toBe(201);
    expect(response.body).toBeDefined();
  });

  it('should not be able to add comment to request without permission', async () => {
    const timestamp = Date.now();

    // Create a test request for another user without assignment
    const otherUserAuth1 = await createAndAuthenticateUser(
      app as unknown as FastifyInstance,
      'USER',
    );
    const otherUserAuth2 = await createAndAuthenticateUser(
      app as unknown as FastifyInstance,
      'USER',
    );

    const testRequest = await prisma.request.create({
      data: {
        title: `Test Request ${timestamp}`,
        description: 'Test description for comment',
        type: 'ACCESS_REQUEST',
        priority: 'MEDIUM',
        status: 'SUBMITTED',
        targetType: 'USER',
        targetId: otherUserAuth1.user.user.id,
        requesterId: otherUserAuth1.user.user.id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const response = await request(app.server)
      .post(`/v1/requests/${testRequest.id}/comments`)
      .set('Authorization', `Bearer ${otherUserAuth2.token}`)
      .send({
        content: 'This comment should not be allowed',
      });

    expect(response.status).toBe(403);
  });

  it('should not be able to add comment without authentication', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .post(`/v1/requests/${fakeId}/comments`)
      .send({
        content: 'This should require authentication',
      });

    expect(response.status).toBe(401);
  });

  it('should not be able to add comment to a request that does not exist', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .post(`/v1/requests/${fakeId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: 'This request does not exist',
      });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Request not found');
  });

  it('should not be able to add comment with invalid id format', async () => {
    const response = await request(app.server)
      .post('/v1/requests/invalid-id/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: 'This should fail due to invalid ID',
      });

    expect(response.status).toBe(400);
  });
});

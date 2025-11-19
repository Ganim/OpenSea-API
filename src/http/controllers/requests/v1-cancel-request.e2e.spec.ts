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

describe('Cancel Request (E2E)', () => {
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

  it('should be able to cancel own request', async () => {
    // Create a test request
    const testRequest = await createRequestE2E({
      title: 'Test Request for cancel',
      description: 'Test description for cancel',
      type: 'ACCESS_REQUEST',
      priority: 'MEDIUM',
      status: 'SUBMITTED',
      targetType: 'USER',
      requesterId: user.user.id,
    });

    const response = await request(app.server)
      .patch(`/v1/requests/${testRequest.id}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        cancellationReason:
          'Test cancellation reason with more than 10 characters',
      });

    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();

    // Verify request was cancelled in database
    const requestInDb = await prisma.request.findUnique({
      where: { id: testRequest.id },
    });

    expect(requestInDb).toBeDefined();
    expect(requestInDb?.status).toBe('CANCELLED');
  });

  it('should be able to cancel request as admin', async () => {
    // Create a test request
    const testRequest = await createRequestE2E({
      title: 'Test Request for admin cancel',
      description: 'Test description for cancel',
      type: 'ACCESS_REQUEST',
      priority: 'MEDIUM',
      status: 'SUBMITTED',
      targetType: 'USER',
      requesterId: user.user.id,
    });

    const response = await request(app.server)
      .patch(`/v1/requests/${testRequest.id}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        cancellationReason:
          'Test cancellation reason with more than 10 characters',
      });

    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();

    // Verify request was cancelled in database
    const requestInDb = await prisma.request.findUnique({
      where: { id: testRequest.id },
    });

    expect(requestInDb).toBeDefined();
    expect(requestInDb?.status).toBe('CANCELLED');
  });

  it('should not be able to cancel request from another user', async () => {
    // Create a test request for another user
    const otherUserAuth = await createAndAuthenticateUser(
      app as unknown as FastifyInstance,
      'USER',
    );

    const testRequest = await createRequestE2E({
      title: 'Test Request for other user',
      description: 'Test description for cancel',
      type: 'ACCESS_REQUEST',
      priority: 'MEDIUM',
      status: 'SUBMITTED',
      targetType: 'USER',
      requesterId: otherUserAuth.user.user.id,
    });

    const response = await request(app.server)
      .patch(`/v1/requests/${testRequest.id}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        cancellationReason:
          'Test cancellation reason with more than 10 characters',
      });

    expect(response.status).toBe(403);
  });

  it('should not be able to cancel a completed request', async () => {
    // Create a completed request
    const testRequest = await createRequestE2E({
      title: 'Test Completed Request',
      description: 'Test description for cancel',
      type: 'ACCESS_REQUEST',
      priority: 'MEDIUM',
      status: 'COMPLETED',
      targetType: 'USER',
      requesterId: user.user.id,
    });

    const response = await request(app.server)
      .patch(`/v1/requests/${testRequest.id}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        cancellationReason:
          'Test cancellation reason with more than 10 characters',
      });

    expect(response.status).toBe(400);
  });

  it('should not be able to cancel request without authentication', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .patch(`/v1/requests/${fakeId}/cancel`)
      .send({
        cancellationReason:
          'Test cancellation reason with more than 10 characters',
      });

    expect(response.status).toBe(401);
  });

  it('should not be able to cancel a request that does not exist', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .patch(`/v1/requests/${fakeId}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        cancellationReason:
          'Test cancellation reason with more than 10 characters',
      });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Request not found');
  });

  it('should not be able to cancel a request with invalid id format', async () => {
    const response = await request(app.server)
      .patch('/v1/requests/invalid-id/cancel')
      .set('Authorization', `Bearer ${token}`)
      .send({
        cancellationReason:
          'Test cancellation reason with more than 10 characters',
      });

    expect(response.status).toBe(400);
  });
});

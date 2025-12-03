import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createRequestE2E } from '@/utils/tests/factories/core/create-request.e2e';
import type { FastifyInstance } from 'fastify';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let token: string;
let user: { user: { id: string } };

describe('Request Info (E2E)', () => {
  beforeAll(async () => {
    await app.ready();

    const userAuthData = await createAndAuthenticateUser(
      app as unknown as FastifyInstance,
      'USER',
    );
    token = userAuthData.token;
    user = userAuthData.user;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to request info from assigned user', async () => {
    const adminAuthData = await createAndAuthenticateUser(
      app as unknown as FastifyInstance,
      'ADMIN',
    );

    // Create a test request and assign it to admin
    const testRequest = await createRequestE2E({
      targetId: user.user.id,
      requesterId: user.user.id,
      status: 'IN_PROGRESS',
      assignedToId: adminAuthData.user.user.id,
    });

    const response = await request(app.server)
      .patch(`/v1/requests/${testRequest.id}/request-info`)
      .set('Authorization', `Bearer ${adminAuthData.token}`)
      .send({
        infoRequested:
          'Please provide additional information about your request with at least 10 characters',
      });

    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();

    // Verify request status changed to PENDING_INFO in database
    const requestInDb = await prisma.request.findUnique({
      where: { id: testRequest.id },
    });

    expect(requestInDb).toBeDefined();
    expect(requestInDb?.status).toBe('PENDING_INFO');
  });

  it('should not be able to request info from non-assigned user', async () => {
    // Create a test request assigned to someone else
    const otherUserAuth = await createAndAuthenticateUser(
      app as unknown as FastifyInstance,
      'USER',
    );

    const testRequest = await createRequestE2E({
      targetId: user.user.id,
      requesterId: user.user.id,
      status: 'IN_PROGRESS',
      assignedToId: otherUserAuth.user.user.id,
    });

    const response = await request(app.server)
      .patch(`/v1/requests/${testRequest.id}/request-info`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        infoRequested:
          'Please provide additional information about your request with at least 10 characters',
      });

    expect(response.status).toBe(403);
  });

  it('should not be able to request info from non-in-progress request', async () => {
    const adminAuthData = await createAndAuthenticateUser(
      app as unknown as FastifyInstance,
      'ADMIN',
    );

    // Create a test request with SUBMITTED status
    const testRequest = await createRequestE2E({
      targetId: user.user.id,
      requesterId: user.user.id,
      status: 'SUBMITTED',
      assignedToId: adminAuthData.user.user.id,
    });

    const response = await request(app.server)
      .patch(`/v1/requests/${testRequest.id}/request-info`)
      .set('Authorization', `Bearer ${adminAuthData.token}`)
      .send({
        infoRequested:
          'Please provide additional information about your request with at least 10 characters',
      });

    expect(response.status).toBe(400);
  });

  it('should not be able to request info without authentication', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .patch(`/v1/requests/${fakeId}/request-info`)
      .send({
        infoRequested:
          'Please provide additional information about your request with at least 10 characters',
      });

    expect(response.status).toBe(401);
  });

  it('should not be able to request info from a request that does not exist', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .patch(`/v1/requests/${fakeId}/request-info`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        infoRequested:
          'Please provide additional information about your request with at least 10 characters',
      });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Request not found');
  });

  it('should not be able to request info with invalid id format', async () => {
    const response = await request(app.server)
      .patch('/v1/requests/invalid-id/request-info')
      .set('Authorization', `Bearer ${token}`)
      .send({
        infoRequested:
          'Please provide additional information about your request with at least 10 characters',
      });

    expect(response.status).toBe(400);
  });
});

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createRequestE2E } from '@/utils/tests/factories/core/create-request.e2e';
import type { FastifyInstance } from 'fastify';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let token: string;
let user: { user: { id: string } };

describe('Provide Info (E2E)', () => {
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

  it('should be able to provide info as the requester', async () => {
    // Create a test request in PENDING_INFO status
    const adminUser = await createAndAuthenticateUser(
      app as unknown as FastifyInstance,
      'ADMIN',
    );

    const testRequest = await createRequestE2E({
      title: 'Test Request for provide info',
      description: 'Test description for provide info',
      type: 'ACCESS_REQUEST',
      priority: 'MEDIUM',
      status: 'PENDING_INFO',
      targetType: 'USER',
      requesterId: user.user.id,
      assignedToId: adminUser.user.user.id,
    });

    const response = await request(app.server)
      .patch(`/v1/requests/${testRequest.id}/provide-info`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        informationProvided:
          'Here is the additional information you requested with more than 10 characters',
      });

    expect(response.status).toBe(200);
    expect(response.body).toBeDefined();

    // Verify request status changed to SUBMITTED in database
    const requestInDb = await prisma.request.findUnique({
      where: { id: testRequest.id },
    });

    expect(requestInDb).toBeDefined();
    expect(requestInDb?.status).toBe('SUBMITTED');
  });

  it('should not be able to provide info from non-requester user', async () => {
    // Create a test request for another user in PENDING_INFO status
    const otherUserAuth = await createAndAuthenticateUser(
      app as unknown as FastifyInstance,
      'USER',
    );

    const adminUser = await createAndAuthenticateUser(
      app as unknown as FastifyInstance,
      'ADMIN',
    );

    const testRequest = await createRequestE2E({
      title: 'Test Request for other user provide info',
      description: 'Test description for provide info',
      type: 'ACCESS_REQUEST',
      priority: 'MEDIUM',
      status: 'PENDING_INFO',
      targetType: 'USER',
      requesterId: otherUserAuth.user.user.id,
      assignedToId: adminUser.user.user.id,
    });

    const response = await request(app.server)
      .patch(`/v1/requests/${testRequest.id}/provide-info`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        informationProvided:
          'Here is the additional information you requested with more than 10 characters',
      });

    expect(response.status).toBe(403);
  });

  it('should not be able to provide info from non-pending-info request', async () => {
    // Create a test request with IN_PROGRESS status
    const adminUser = await createAndAuthenticateUser(
      app as unknown as FastifyInstance,
      'ADMIN',
    );

    const testRequest = await createRequestE2E({
      title: 'Test Request in progress',
      description: 'Test description for provide info',
      type: 'ACCESS_REQUEST',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      targetType: 'USER',
      requesterId: user.user.id,
      assignedToId: adminUser.user.user.id,
    });

    const response = await request(app.server)
      .patch(`/v1/requests/${testRequest.id}/provide-info`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        informationProvided:
          'Here is the additional information you requested with more than 10 characters',
      });

    expect(response.status).toBe(400);
  });

  it('should not be able to provide info without authentication', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .patch(`/v1/requests/${fakeId}/provide-info`)
      .send({
        informationProvided:
          'Here is the additional information you requested with more than 10 characters',
      });

    expect(response.status).toBe(401);
  });

  it('should not be able to provide info from a request that does not exist', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .patch(`/v1/requests/${fakeId}/provide-info`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        informationProvided:
          'Here is the additional information you requested with more than 10 characters',
      });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Request not found');
  });

  it('should not be able to provide info with invalid id format', async () => {
    const response = await request(app.server)
      .patch('/v1/requests/invalid-id/provide-info')
      .set('Authorization', `Bearer ${token}`)
      .send({
        informationProvided:
          'Here is the additional information you requested with more than 10 characters',
      });

    expect(response.status).toBe(400);
  });
});
